import React, { useState } from 'react';

// Helper styles
const styles = {
  treeContainer: {
    minHeight: '100vh',
    background: '#f8fafd',
    padding: '40px 14px',
    fontFamily: 'Segoe UI, sans-serif',
  },
  wrapper: {
    maxWidth: 600,
    margin: '0 auto',
    background: '#fff',
    padding: 32,
    borderRadius: 16,
    boxShadow: '0 4px 24px 0 rgba(80, 125, 230, 0.10)',
  },
  h1: {
    fontSize: 32,
    fontWeight: 700,
    color: '#22223b',
    marginBottom: 24,
    textAlign: 'center',
  },
  treeBox: {
    border: '1px solid #e0e4ec',
    borderRadius: 10,
    padding: 18,
    background: '#fcfcfd',
    // minHeight: 300,
  },
  node: {
    display: 'flex',
    alignItems: 'center',
    padding: '7px 16px',
    margin: '7px 0',
    borderRadius: 8,
    background: '#f3f7fa',
    transition: 'background 120ms',
    cursor: 'grab',
    fontWeight: 500,
    fontSize: 16,
  },
  nodeDragging: {
    opacity: 0.45,
  },
  nodeDropping: {
    background: '#c6dbff',
    outline: '2px dashed #3466d3',
  },
  childIndent: {
    borderLeft: '1.5px solid #e2e8f0',
    marginLeft: 28,
    paddingLeft: 12,
  },
  icon: {
    marginRight: 10,
    width: 22,
    height: 22,
  },
  jsonBox: {
    marginTop: 32,
    padding: 18,
    background: '#f6f9ff',
    borderRadius: 7,
    boxShadow: '0 0 0 1px #e9eef5',
    fontSize: 14,
    maxHeight: 220,
    overflow: 'auto',
  },
  heading2: {
    fontWeight: 600,
    fontSize: "18px",
    marginBottom: 8,
    color: '#07204f',
  }
};

// TreeNode component for recursive rendering and drag-and-drop
const TreeNode = ({ node, treeData, setTreeData, parentId = null }) => {
  // State to manage if the current node is being dragged
  const [isDragging, setIsDragging] = useState(false);
  // State to manage if the current node is a valid drop target
  const [isDropping, setIsDropping] = useState(false);

  // Handle the start of a drag operation
  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('nodeId', node.id);
    setIsDragging(true);
  };

  // Handle the end of a drag operation
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Handle drag over event to allow dropping
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedNodeId = e.dataTransfer.getData('nodeId');
    if (draggedNodeId !== node.id) {
      setIsDropping(true);
    }
  };

  // Handle drag leave event
  const handleDragLeave = () => {
    setIsDropping(false); 
  };

  // Recursive function to find and remove a node from the tree
  const removeNode = (nodes, nodeIdToRemove) => {
    return nodes.reduce((acc, currentNode) => {
      if (currentNode.id === nodeIdToRemove) {
        return acc;
      }
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
          return [currentNode, nodeToAdd];
        } else {
          return {
            ...currentNode,
            children: [...(currentNode.children || []), nodeToAdd],
          };
        }
      }
      if (currentNode.children) {
        const updatedChildren = addNode(
          currentNode.children,
          targetNodeId,
          nodeToAdd,
          asSibling
        );
        // Flatten possible double arrays from sibling add
        return { ...currentNode, children: [].concat(...updatedChildren) };
      }
      return currentNode;
    });
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

  // Handle the drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropping(false);

    const draggedNodeId = e.dataTransfer.getData('nodeId');
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

    if (!draggedNode) return;

    let newTreeData = JSON.parse(JSON.stringify(treeData));
    newTreeData = removeNode(newTreeData, draggedNodeId);

    // Determine if dropping as a child or sibling (optional, here as child of folder)
    if (node.type === 'folder') {
      newTreeData = addNode(newTreeData, node.id, draggedNode, false);
    } else {
      // Do not allow dropping onto a file
      return;
    }

    setTreeData(newTreeData);
  };

  return (
    <div
      draggable
      style={{
        ...styles.node,
        ...(isDragging ? styles.nodeDragging : {}),
        ...(isDropping && node.type === 'folder' ? styles.nodeDropping : {}),
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {node.type === 'folder' ? (
        // Folder SVG
        <svg style={styles.icon} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="6.5" width="20" height="13" rx="2.5" fill="#f8d067" stroke="#f0a801" />
          <rect x="2" y="5" width="7" height="4" rx="1.5" fill="#ffe59e" stroke="#f0a801" />
        </svg>
      ) : (
        // File SVG
        <svg style={styles.icon} viewBox="0 0 21 21" fill="none">
          <rect x="3" y="2" width="15" height="17" rx="2" fill="#e6e6e6" stroke="#bababa" />
          <rect x="5" y="5" width="11" height="2.5" fill="#bababa" />
          <rect x="5" y="9" width="11" height="1.5" fill="#bababa" />
        </svg>
      )}
      <span style={{ color: '#295060' }}>
        {node.label}
      </span>
      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div style={styles.childIndent}>
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
const App = () => {
  const [treeData, setTreeData] = useState([
    {
      id: '1',
      label: 'Documents',
      type: 'folder',
      children: [
        { id: '1-1', label: 'Project Alpha', type: 'folder', children: [] },
        { id: '1-2', label: 'Meeting Notes.txt', type: 'file' },
        {
          id: '1-3',
          label: 'Reports',
          type: 'folder',
          children: [
            { id: '1-3-1', label: 'Q1 Report.pdf', type: 'file' },
            { id: '1-3-2', label: 'Q2 Report.pdf', type: 'file' },
          ],
        },
      ],
    },
    {
      id: '2',
      label: 'Images',
      type: 'folder',
      children: [
        { id: '2-1', label: 'Vacation Photos', type: 'folder', children: [] },
        { id: '2-2', label: 'Work Graphics.png', type: 'file' },
      ],
    },
    { id: '3', label: 'Readme.md', type: 'file' },
  ]);

  return (
    <div style={styles.treeContainer}>
      <div style={styles.wrapper}>
        <h1 style={styles.h1}>Drag-and-Drop Tree</h1>
        <div style={styles.treeBox}>
          {treeData.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              treeData={treeData}
              setTreeData={setTreeData}
            />
          ))}
        </div>
        <div style={styles.jsonBox}>
          <span style={styles.heading2}>Current Tree Data (JSON):</span>
          <pre style={{ background: 'inherit', border: 0, margin: 0 }}>
            {JSON.stringify(treeData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default App;
