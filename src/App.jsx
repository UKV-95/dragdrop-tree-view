import React, { useState } from 'react';

const styles = {
  treeContainer: {
    minHeight: '100vh',
    backgroundColor: '#fdfdfd',
    padding: '30px 16px',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },
  treeWrapper: {
    maxWidth: 600,
    margin: '0 auto',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  button: {
    padding: '8px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    transition: '0.2s',
  },
  buttonHover: {
    backgroundColor: '#e2e6ea',
  },
  node: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    padding: '6px 12px',
    cursor: 'grab',
    borderRadius: 8,
    userSelect: 'none',
    transition: 'background-color 0.15s ease-in-out',
  },
  nodeDragging: { opacity: 0.5 },
  nodeDropping: {
    backgroundColor: '#e1f0ff',
    boxShadow: 'inset 0 0 0 2px #3399ff',
  },
  icon: {
    width: 20,
    height: 20,
    flexShrink: 0,
    marginRight: 12,
    fill: '#6b7280',
  },
  label: { fontSize: 16, color: '#374151' },
  childrenWrapper: {
    marginLeft: 20,
    borderLeft: '2px solid #e5e7eb',
    paddingLeft: 12,
  },
};

const FolderIcon = () => (
  <svg
    style={styles.icon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 8v-2a2 2 0 012-2h6l2 2h8a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
  </svg>
);

const FileIcon = () => (
  <svg
    style={styles.icon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const TreeNode = ({ node, treeData, setTreeData }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCollapseToggle = (e) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('nodeId', node.id);
    setIsDragging(true);
  };

  const handleDragEnd = () => setIsDragging(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedNodeId = e.dataTransfer.getData('nodeId');
    if (draggedNodeId !== node.id && node.type === 'folder') {
      setIsDropping(true);
    }
  };

  const handleDragLeave = () => setIsDropping(false);

  // --- Helper functions ---
  const removeNode = (nodes, nodeIdToRemove) =>
    nodes.reduce((acc, current) => {
      if (current.id === nodeIdToRemove) return acc;
      if (current.children) {
        current = { ...current, children: removeNode(current.children, nodeIdToRemove) };
      }
      acc.push(current);
      return acc;
    }, []);

  const addNode = (nodes, targetNodeId, nodeToAdd) =>
    nodes.map((current) => {
      if (current.id === targetNodeId) {
        return {
          ...current,
          children: [...(current.children || []), nodeToAdd],
        };
      }
      if (current.children) {
        return { ...current, children: addNode(current.children, targetNodeId, nodeToAdd) };
      }
      return current;
    });

  const findNodeAndParent = (nodes, id, parent = null) => {
    for (const n of nodes) {
      if (n.id === id) return { node: n, parent };
      if (n.children) {
        const found = findNodeAndParent(n.children, id, n);
        if (found) return found;
      }
    }
    return null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropping(false);

    const draggedNodeId = e.dataTransfer.getData('nodeId');
    if (draggedNodeId === node.id) return;

    const found = findNodeAndParent(treeData, draggedNodeId);
    if (!found) return;

    let newTreeData = JSON.parse(JSON.stringify(treeData));
    newTreeData = removeNode(newTreeData, draggedNodeId);

    if (node.type === 'folder') {
      newTreeData = addNode(newTreeData, node.id, found.node);
    }

    setTreeData(newTreeData);
  };

  return (
    <div>
      <div
        draggable
        style={{
          ...styles.node,
          ...(isDragging ? styles.nodeDragging : {}),
          ...(isDropping ? styles.nodeDropping : {}),
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={node.type === 'folder' ? handleCollapseToggle : undefined}
      >
        {node.type === 'folder' ? (
          <>
            <span style={{ marginRight: 6 }}>{isCollapsed ? '▶' : '▼'}</span>
            <FolderIcon />
          </>
        ) : (
          <FileIcon />
        )}
        <span style={styles.label}>{node.label}</span>
      </div>

      {!isCollapsed && node.children && node.children.length > 0 && (
        <div style={styles.childrenWrapper}>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              treeData={treeData}
              setTreeData={setTreeData}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [treeData, setTreeData] = useState([
    {
      id: '1',
      label: 'My Documents',
      type: 'folder',
      children: [
        {
          id: '1-1',
          label: 'Work',
          type: 'folder',
          children: [
            { id: '1-1-1', label: 'Resume.docx', type: 'file' },
            { id: '1-1-2', label: 'Project Plan.pdf', type: 'file' },
          ],
        },
        {
          id: '1-2',
          label: 'Personal',
          type: 'folder',
          children: [
            { id: '1-2-1', label: 'Travel Itinerary.pdf', type: 'file' },
            { id: '1-2-2', label: 'Shopping List.txt', type: 'file' },
          ],
        },
        {
          id: '1-3',
          label: 'Finances',
          type: 'folder',
          children: [
            {
              id: '1-3-1',
              label: 'Bank Statements',
              type: 'folder',
              children: [
                { id: '1-3-1-1', label: 'Jan.pdf', type: 'file' },
                { id: '1-3-1-2', label: 'Feb.pdf', type: 'file' },
              ],
            },
            { id: '1-3-2', label: 'Budget.xlsx', type: 'file' },
          ],
        },
        { id: '1-4', label: 'Notes.txt', type: 'file' },
      ],
    },
  ]);

  // Add File function
  const addFile = () => {
    const name = prompt('Enter file name:');
    if (!name) return;
    setTreeData((prev) => {
      const newTree = [...prev];
      newTree[0].children.push({
        id: Date.now().toString(),
        label: name,
        type: 'file',
      });
      return newTree;
    });
  };

  // Add Folder function
  const addFolder = () => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    setTreeData((prev) => {
      const newTree = [...prev];
      newTree[0].children.push({
        id: Date.now().toString(),
        label: name,
        type: 'folder',
        children: [],
      });
      return newTree;
    });
  };

  return (
    <div style={styles.treeContainer}>
      <div style={styles.treeWrapper}>
        <h1 style={styles.header}>📂 My Documents</h1>

        {/* Toolbar for adding file/folder */}
        <div style={styles.toolbar}>
          <button style={styles.button} onClick={addFile}>➕ Add File</button>
          <button style={styles.button} onClick={addFolder}>📁 Add Folder</button>
        </div>

        {treeData.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            treeData={treeData}
            setTreeData={setTreeData}
          />
        ))}
      </div>
    </div>
  );
};

export default App;
