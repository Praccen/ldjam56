import { vec3 } from "gl-matrix";
import OBB from "../Physics/Physics/Shapes/OBB";
import Shape from "../Physics/Physics/Shapes/Shape";
import { IntersectionTester } from "../Physics/Physics/IntersectionTester";
import { Ray } from "../../Engine";

export class OctreeNodeContentElement {
  // You can inherit from this to create any content you want in the octree
  shape: Shape;
  constructor(detectionShape: Shape) {
    this.shape = detectionShape;
  }
}

export class TreeNode {
	obb: OBB;
	size: number;
	position: vec3;
  minNodeSize: number;
  maxContentPerNode: number;
	children: Array<TreeNode>;
	content: Array<OctreeNodeContentElement>;

	constructor(size: number, position: vec3, minNodeSize: number, maxContentPerNode: number) {
		this.obb = new OBB();
		this.size = size;
		this.position = position;
    this.maxContentPerNode = maxContentPerNode;
    this.minNodeSize = minNodeSize;
		let halfSize = size * 0.5;
		this.obb.setMinAndMaxVectors(
			vec3.add(vec3.create(), vec3.fromValues(-halfSize, -halfSize, -halfSize), this.position),
			vec3.add(vec3.create(), vec3.fromValues(halfSize, halfSize, halfSize), this.position)
		);

		this.children = new Array<TreeNode>();
		this.content = new Array<OctreeNodeContentElement>();
	}

	/**
	 * Create 8 child nodes
	 * @returns if new children was created. Will be false if there already exists children for this node or the sizes of the children would be smaller than minNodeSize.
	 */
	createChildren(): boolean {
		let halfSize = this.size * 0.5;
		if (this.children.length == 0 && halfSize >= this.minNodeSize) {
			let quarterSize = this.size * 0.25;
			for (let x = -1; x < 2; x += 2) {
				for (let y = -1; y < 2; y += 2) {
					for (let z = -1; z < 2; z += 2) {
						this.children.push(
							new TreeNode(
								halfSize,
								vec3.add(
									vec3.create(),
									vec3.fromValues(x * quarterSize, y * quarterSize, z * quarterSize),
									this.position,
								),
                this.minNodeSize,
                this.maxContentPerNode
							)
						);
					}
				}
			}

			return true;
		}

		return false;
	}

	private checkIfContains(shape: Shape) {
		let minVec = vec3.subtract(
			vec3.create(),
			this.position,
			vec3.fromValues(this.size / 2.0, this.size / 2.0, this.size / 2.0)
		);
		let maxVec = vec3.add(
			vec3.create(),
			this.position,
			vec3.fromValues(this.size / 2.0, this.size / 2.0, this.size / 2.0)
		);
		let shapeVertices = shape.getTransformedVertices();
		for (const vertex of shapeVertices) {
			for (let i = 0; i < 3; i++) {
				if (minVec[i] > vertex[i] || vertex[i] > maxVec[i]) {
					return false;
				}
			}
		}
		return true;
	}

  getExpansionDirection(shape: Shape) {
    let shapeVertices = shape.getTransformedVertices();
    let distMax = vec3.fromValues(-Infinity, -Infinity, -Infinity);
    let distMin = vec3.fromValues(Infinity, Infinity, Infinity);
    for (let vertex of shapeVertices) {
			vec3.max(distMax, distMax, vec3.sub(vec3.create(), vertex, this.position));
			vec3.min(distMin, distMin, vec3.sub(vec3.create(), vertex, this.position));
		}

    let expansionDirection = vec3.create();
    for (let i = 0; i < 3; i++) {
      if (Math.abs(distMax[i]) > Math.abs(distMin[i])) {
        expansionDirection[i] = distMax[i];
      }
      else {
        expansionDirection[i] = distMin[i];
      }
    }

		// Make the expansion direction be 1 or -1 in every direction
    for (let i = 0; i < 3; i++) {
			expansionDirection[i] = Math.sign(expansionDirection[i]); // Sign can be 0, if so, make it one
			if (Math.abs(expansionDirection[i]) < 0.01) {
				expansionDirection[i] = 1.0;
			}
		}
    return expansionDirection;
  }

	count(): number {
		let counter = this.content.length;
		for (const child of this.children) {
			counter += child.count();
		}
		
		return counter;
	}

	subdivideTree() {
		this.createChildren();

		for (let child of this.children) {
			child.subdivideTree();
		}
	}

	addContent(content: OctreeNodeContentElement): boolean {
		if (
			this.checkIfContains(content.shape)
		) {
			if (this.children.length == 0) {
				// Leaf node
				if (this.content.length >= this.maxContentPerNode) {
					// New children are needed
					this.createChildren(); // This will create children if the size of the child nodes are still bigger than the minNodeSize
				}

				if (this.children.length == 0) {
					// Still leaf node
					this.content.push(content);
					return true;
				}
				else {
					// No longer leaf node
					// Add all the content from this node to child nodes instead (if they fit)

					// Below seems stupid, but it avoids copy
					let toMove = this.content.splice(0, this.content.length);
					while (toMove.length > 0) {
						let element = toMove.pop() 
						let added = false;
						for (const child of this.children) {
							if (child.addContent(element)) {
								added = true;
								break;
							}
						}
						if (!added) {
							this.content.push(element);
						}
					}
				}
			}

			// Not leaf node, try to add to children
			for (const child of this.children) {
				if (child.addContent(content)) {
					return true;
				}
			}

			// Couldn't fit content into any child, add to this
			this.content.push(content);
			return true;
		}
		return false;
	}

  removeContent(searchPredicate: (value: OctreeNodeContentElement) => {}) {
    let findIdx = this.content.findIndex(searchPredicate);
    if (findIdx != -1) {
      this.content.splice(findIdx, 1);
      return;
    }

    for (const child of this.children) {
      child.removeContent(searchPredicate);
    }
  }

  recalculate(recalculatedContentArray: Array<OctreeNodeContentElement>) {
    // Go to the bottom of the tree and pick up any content that no longer fits
    for (const child of this.children) {
      child.recalculate(recalculatedContentArray);
    }

		for (let i = 0; i < recalculatedContentArray.length; i++) {
      // Try to add the content that didn't fit some child to this node, to see if we need to bring this up further
      if (this.addContent(recalculatedContentArray[i])) {
        recalculatedContentArray.splice(i, 1);
        i--;
      }
    }

		// Store the content that no longer fits in their node
		for (let i = 0; i < this.content.length; i++) {
			if (this.content[i].shape.getVertexUpdateNeeded() && !this.checkIfContains(this.content[i].shape)) {
				recalculatedContentArray.push(this.content[i]);
				this.content.splice(i, 1);
				i--;
			}
		}
  }

	prune() {
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].prune();
		}

		for (const child of this.children) {
			if (child.content.length > 0 || child.children.length > 0) {
				return;
			}
		}

		// If we got here it means all children are empty on both content and children, then we can clear the children for this node
		this.children.length = 0;
	}

	getContentFromIntersection(intersectionShape: Shape, contentArray: Array<OctreeNodeContentElement>) {
		if (IntersectionTester.identifyIntersection([intersectionShape], [this.obb])) {
			for (const child of this.children) {
				child.getContentFromIntersection(intersectionShape, contentArray);
			}

			for (const content of this.content) {
				contentArray.push(content);
			}
		}
	}

	getContentFromContinousIntersection(
		intesectionShape: Shape,
		velocity1: vec3,
		velocity2: vec3,
		contentArray: Array<OctreeNodeContentElement>,
		maxTime: number = Infinity
	) {
		if (
			IntersectionTester.doContinousIntersection(
				[intesectionShape],
				velocity1,
				[this.obb],
				velocity2,
				maxTime
			)[0] >= 0.0
		) {
			for (const child of this.children) {
				child.getContentFromContinousIntersection(
					intesectionShape,
					velocity1,
					velocity2,
					contentArray,
					maxTime
				);
			}

			for (const content of this.content) {
				contentArray.push(content);
			}
		}
	}

	getContentForRayCast(ray: Ray, contentArray: Array<OctreeNodeContentElement>, maxDistance: number = Infinity) { 
		if (IntersectionTester.doRayCast(ray, [this.obb], maxDistance) < Infinity) {
			for (const child of this.children) {
				child.getContentForRayCast(ray, contentArray, maxDistance);
			}

			for (const content of this.content) {
				contentArray.push(content);
			}
		}
	}
}

export default class Octree {
	baseNode: TreeNode;
	minNodeSize: number;
	maxContentPerNode: number;

	constructor(
		minVec: vec3,
		maxVec: vec3,
		smallestNodeSize: number,
		maxContentPerNode: number
	) {
		console.log("Octree constructor start");
		let baseNodeSize = maxVec[0] - minVec[0];
		baseNodeSize = Math.max(baseNodeSize, maxVec[1] - minVec[1]);
		baseNodeSize = Math.max(baseNodeSize, maxVec[2] - minVec[2]);

		this.minNodeSize = smallestNodeSize;
		this.maxContentPerNode = maxContentPerNode;

		this.baseNode = new TreeNode(
			baseNodeSize,
			vec3.scale(vec3.create(), vec3.add(vec3.create(), minVec, maxVec), 0.5),
      this.minNodeSize,
      this.maxContentPerNode
		);
		
		console.log("Octree constructor end");
	}

	addContent(content: OctreeNodeContentElement) {
    if (!this.baseNode.addContent(content)) {
      // Expand root node, or rather create a level higher and add the current root node as one of the children
      let expansionDirection = this.baseNode.getExpansionDirection(content.shape); // Get the direction to expand in
      let newBaseNode = new TreeNode(this.baseNode.size * 2.0, vec3.scaleAndAdd(vec3.create(), this.baseNode.position, expansionDirection, this.baseNode.size * 0.5), this.minNodeSize, this.maxContentPerNode); // Make a new base node with twice the size of the current. Set it's center in the expand direction
      if (!newBaseNode.createChildren()) { // Create children
				console.error("Octree couldn't create children when expanding");
				return;
			}
			
			let childIndex = newBaseNode.children.findIndex((value) => {return vec3.dist(value.position, this.baseNode.position) < 0.00001});
			
			if (childIndex == -1) {
				console.error("Octree: Couldn't find child to replace with previous base node when expanding base node");
			}
			else {
				newBaseNode.children[childIndex] = this.baseNode;
			}

      this.baseNode = newBaseNode; // Set the current base node to the newly created, bigger one

			// Try adding the content to the new baseNode by calling this function again (which will allow it to keep expanding if still needed)
			this.addContent(content);
    }
	}

	addContentArray(contents: Array<OctreeNodeContentElement>) {
		for (let content of contents) {
			this.addContent(content);
		}
	}

  removeContent(searchPredicate: (value: OctreeNodeContentElement) => {}) {
    this.baseNode.removeContent(searchPredicate);
  }

  recalculate() {
    let recalculatedContentArray = new Array<OctreeNodeContentElement>(); // This will traverse the tree and pick up and place items that has moved
		// const countBefore = this.baseNode.count();
    this.baseNode.recalculate(recalculatedContentArray);
		// const countDuring = this.baseNode.count();
		// if (countBefore != countDuring + recalculatedContentArray.length) {
		// 	console.error("Recalculation of octree: Sum of content moved outside of tree and the content inside of tree did not result in the same number of items as was in the the tree before recalculation")
		// }
    this.addContentArray(recalculatedContentArray); // If there are still elements in the array once the recalculation is done, we have to expand the base node, this will be done by adding the content to the octree again
		// const countAfter = this.baseNode.count();
		// if (countBefore != countAfter) {
		// 	console.error("Recalculation of octree: Number of content elements changed during recalculation");
		// }
  }

	prune() {
		this.baseNode.prune();
	}

	getContentFromIntersection(intesectionShape: Shape, contentArray: Array<OctreeNodeContentElement>) {
		this.baseNode.getContentFromIntersection(intesectionShape, contentArray);
	}

	getContentFromContinousIntersection(
		intesectionShape: Shape,
		velocity1: vec3,
		velocity2: vec3,
		contentArray: Array<OctreeNodeContentElement>,
		maxTime: number = Infinity
	) {
		this.baseNode.getContentFromContinousIntersection(
			intesectionShape,
			velocity1,
			velocity2,
			contentArray,
			maxTime
		);
	}

	getContentForRayCast(ray: Ray, contentArray: Array<OctreeNodeContentElement>, maxDistance: number = Infinity) {
		this.baseNode.getContentForRayCast(ray, contentArray, maxDistance);
	}
}
