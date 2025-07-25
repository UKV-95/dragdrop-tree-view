import React, { useState } from 'react';

// TreeNode component for recursive rendering and drag-and-drop
export  const TreeNode = ({ node, treeData, setTreeData, parentId = null }) => {
  // State to manage if the current node is being dragged
  const [isDragging, setIsDragging] = useState(false);
  // State to manage if the current node is a valid drop target
  const [isDropping, setIsDropping] = useState(false);

  // Handle the start of a drag operation
  const handleDragStart = (e) => {
    e.stopPropagation(); // Stop event propagation to prevent parent drag
    e.dataTransfer.setData('nodeId', node.id); // Set the ID of the dragged node
    setIsDragging(true); // Set dragging state to true for visual feedback
  };

  // Handle the end of a drag operation
  const handleDragEnd = () => {
    setIsDragging(false); // Reset dragging state
  };

  // Handle drag over event to allow dropping
  const handleDragOver = (e) => {
    e.preventDefault(); // Prevent default to allow drop
    e.stopPropagation(); // Stop event propagation
    // Check if the dragged node is not the current node (self-drop blocked)
    const draggedNodeId = e.dataTransfer.getData('nodeId');
    if (draggedNodeId !== node.id) {
      setIsDropping(true); // Indicate valid drop target
    }
  };

  // Handle drag leave event
  const handleDragLeave = () => {
    setIsDropping(false); // Reset drop target state
  };

  // Recursive function to find and remove a node from the tree
  const removeNode = (nodes, nodeIdToRemove) => {
    return nodes.reduce((acc, currentNode) => {
      if (currentNode.id === nodeIdToRemove) {
        return acc; // Skip the node to remove it
      }
      // Recursively check children
      if (currentNode.children) {
        const updatedChildren = removeNode(currentNode.children, nodeIdToRemove);
        return [...acc, { ...currentNode, children: updatedChildren }];
      }
      return [...acc, currentNode];
    }, []);
  };

  // Recursive function to find and add a node to the tree
  const addNode = (nodes, targetNodeId, nodeToAdd, asSibling = false) => {
    return nodes.map((currentNode) => {
      if (currentNode.id === targetNodeId) {
        if (asSibling) {
          // If dropping as a sibling, insert at the same level as the target
          return [currentNode, nodeToAdd];
        } else {
          // If dropping as a child, add to the target's children
          return {
            ...currentNode,
            children: [...(currentNode.children || []), nodeToAdd],
          };
        }
      }
      // Recursively check children
      if (currentNode.children) {
        const updatedChildren = addNode(
          currentNode.children,
          targetNodeId,
          nodeToAdd,
          asSibling
        );
        return { ...currentNode, children: updatedChildren };
      }
      return currentNode;
    });
  };

  // Handle the drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropping(false); // Reset drop target state

    const draggedNodeId = e.dataTransfer.getData('nodeId');
    // Block self-drop
    if (draggedNodeId === node.id) {
      return;
    }

    // Find the dragged node and its original parent
    let draggedNode = null;
    let draggedNodeParentId = null;

    // Helper to find node and its parent
    const findNodeAndParent = (nodes, id, parent = null) => {
      for (const n of nodes) {
        if (n.id === id) {
          draggedNode = n;
          draggedNodeParentId = parent ? parent.id : null;
          return;
        }
        if (n.children) {
          findNodeAndParent(n.children, id, n);
          if (draggedNode) return;
        }
      }
    };

    findNodeAndParent(treeData, draggedNodeId);

    if (!draggedNode) return; // Should not happen if nodeId is valid

    // Create a deep copy of the tree data to ensure immutability
    let newTreeData = JSON.parse(JSON.stringify(treeData));

    // Remove the dragged node from its original position
    newTreeData = removeNode(newTreeData, draggedNodeId);

    // Determine if dropping as a child or sibling
    const dropAsSibling = e.clientY > e.currentTarget.getBoundingClientRect().bottom - 10; // Simple heuristic for sibling drop

    if (dropAsSibling && parentId !== null) {
      // Reorder within the same parent's children or move between siblings
      const parentNode = findNode(newTreeData, parentId);
      if (parentNode && parentNode.children) {
        const updatedChildren = [...parentNode.children, draggedNode]; // Add at the end for now
        // To implement precise reordering, you'd need to calculate the exact drop index
        // For simplicity, we'll just add it to the end of the target's siblings for now.
        // A more complex solution would involve determining the exact drop position based on Y-coordinate.
        parentNode.children = updatedChildren;
      } else {
        // If dropping as sibling but no parent found (e.g., trying to drop a root node as sibling of another root)
        // This case needs careful handling depending on desired behavior.
        // For now, if no parent, treat as a child drop on the target.
        newTreeData = addNode(newTreeData, node.id, draggedNode, false);
      }
    } else {
      // Add the dragged node as a child of the target node
      // Only allow dropping into folders
      if (node.type === 'folder') {
        newTreeData = addNode(newTreeData, node.id, draggedNode, false);
      } else {
        // If dropping onto a file, treat it as a sibling drop if possible, or block
        // For now, if dropping onto a file, we'll block it as per the document's implied behavior
        // "Drag file or folder into a folder becomes a child"
        console.warn('Cannot drop onto a file node.');
        return;
      }
    }

    setTreeData(newTreeData); // Update the tree data
  };

  // Helper to find a node by ID in the tree
  const findNode = (nodes, id) => {
    for (const n of nodes) {
      if (n.id === id) {
        return n;
      }
      if (n.children) {
        const found = findNode(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  return (
    <div
      className={`pl-4 ${isDragging ? 'opacity-50' : ''}`} // Visual feedback for dragging
      draggable // Make the node draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`flex items-center p-2 my-1 rounded-md cursor-grab ${
          isDropping && node.type === 'folder' ? 'bg-blue-200' : 'bg-gray-100' // Highlight drop target for folders
        } ${isDragging ? 'border-2 border-dashed border-blue-500' : ''}`}
      >
        {node.type === 'folder' ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-yellow-500 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-500 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0113 3.414L16.586 7A2 2 0 0118 8.414V16a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm4.5 1A1.5 1.5 0 007 6.5v5A1.5 1.5 0 008.5 13h3A1.5 1.5 0 0013 11.5v-5A1.5 1.5 0 0011.5 5h-3z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span className="font-medium text-gray-800">{node.label}</span>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="border-l border-gray-300 ml-4">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              treeData={treeData}
              setTreeData={setTreeData}
              parentId={node.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main App component
