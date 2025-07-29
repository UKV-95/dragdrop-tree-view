import React, { useState } from "react";

// 🎨 Centralized Styles
const styles = {
  treeContainer: {
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
    padding: "30px 16px",
    fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
  },
  treeWrapper: {
    maxWidth: 600,
    margin: "0 auto",
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
    marginBottom: 16,
    textAlign: "center",
  },
  toolbar: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  button: {
    padding: "8px 12px",
    fontSize: 14,
    border: "1px solid #ddd",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    cursor: "pointer",
    transition: "0.2s",
  },
  node: {
    display: "flex",
    alignItems: "center",
    padding: "6px 12px",
    cursor: "grab",
    borderRadius: 8,
    transition: "background-color 0.15s ease-in-out",
    marginBottom: 4,
  },
  nodeDragging: { opacity: 0.5 },
  nodeDropping: {
    backgroundColor: "#e1f0ff",
    boxShadow: "inset 0 0 0 2px #3399ff",
  },
  icon: {
    width: 20,
    height: 20,
    flexShrink: 0,
    marginRight: 12,
    fill: "#6b7280",
  },
  label: { fontSize: 16, color: "#374151" },
  childrenWrapper: {
    marginLeft: 20,
    borderLeft: "2px solid #e5e7eb",
    paddingLeft: 12,
  },
  deleteButton: {
    marginLeft: "auto",
    background: "red",
    color: "white",
    border: "none",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: 12,
  },
};

// 📁 Folder icon
const FolderIcon = () => (
  <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 8v-2a2 2 0 012-2h6l2 2h8a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
  </svg>
);

// 📄 File icon
const FileIcon = () => (
  <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

// 🌳 Recursive TreeNode
const TreeNode = ({ node, treeData, setTreeData }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ✅ Helper functions
  const removeNode = (nodes, nodeId) =>
    nodes.reduce((acc, current) => {
      if (current.id === nodeId) return acc;
      if (current.children) {
        current = { ...current, children: removeNode(current.children, nodeId) };
      }
      acc.push(current);
      return acc;
    }, []);

  const addNode = (nodes, targetId, newNode) =>
    nodes.map((current) => {
      if (current.id === targetId) {
        return {
          ...current,
          children: [...(current.children || []), newNode],
        };
      }
      if (current.children) {
        return { ...current, children: addNode(current.children, targetId, newNode) };
      }
      return current;
    });

  const findNode = (nodes, id) => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = findNode(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const isDescendant = (nodeToCheck, targetId) => {
    if (!nodeToCheck.children) return false;
    return nodeToCheck.children.some(
      (child) => child.id === targetId || isDescendant(child, targetId)
    );
  };

  // 🏗 Drag Handlers
  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData("nodeId", node.id);
    setIsDragging(true);
  };

  const handleDragEnd = () => setIsDragging(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData("nodeId");
    if (draggedId !== node.id && node.type === "folder") {
      setIsDropping(true);
    }
  };

  const handleDragLeave = () => setIsDropping(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDropping(false);

    const draggedId = e.dataTransfer.getData("nodeId");
    if (draggedId === node.id) return;

    const draggedItem = findNode(treeData, draggedId);
    if (!draggedItem) return;

    if (isDescendant(draggedItem, node.id)) {
      console.warn("❌ Cannot drop parent into its own child!");
      return;
    }

    let newTree = JSON.parse(JSON.stringify(treeData));
    newTree = removeNode(newTree, draggedId);

    if (node.type === "folder") {
      newTree = addNode(newTree, node.id, draggedItem);
      setTreeData(newTree);
    }
  };

  // 🗑 Delete Node
  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete "${node.label}"?`)) {
      const updatedTree = removeNode(treeData, id);
      setTreeData(updatedTree);
    }
  };

  return (
    <div>
      {/* Node Row */}
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
        onClick={node.type === "folder" ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        {node.type === "folder" ? <FolderIcon /> : <FileIcon />}
        <span style={styles.label}>{node.label}</span>

        {/* 🗑 Delete Button */}
        <button
          style={styles.deleteButton}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(node.id);
          }}
        >
          🗑
        </button>
      </div>

      {/* Show Children if Folder is Open */}
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

// 📦 Main App
const App = () => {
  const [treeData, setTreeData] = useState([
    {
      id: "1",
      label: "My Documents",
      type: "folder",
      children: [
        {
          id: "1-1",
          label: "Work",
          type: "folder",
          children: [
            { id: "1-1-1", label: "Resume.docx", type: "file" },
            { id: "1-1-2", label: "Project Plan.pdf", type: "file" },
          ],
        },
        {
          id: "1-2",
          label: "Personal",
          type: "folder",
          children: [
            { id: "1-2-1", label: "Travel Itinerary.pdf", type: "file" },
          ],
        },
      ],
    },
  ]);

  // ➕ Add File
  const addFile = () => {
    const name = prompt("Enter file name:");
    if (!name) return;
    setTreeData((prev) => {
      const newTree = [...prev];
      newTree[0].children.push({
        id: Date.now().toString(),
        label: name,
        type: "file",
      });
      return newTree;
    });
  };

  // 📁 Add Folder
  const addFolder = () => {
    const name = prompt("Enter folder name:");
    if (!name) return;
    setTreeData((prev) => {
      const newTree = [...prev];
      newTree[0].children.push({
        id: Date.now().toString(),
        label: name,
        type: "folder",
        children: [],
      });
      return newTree;
    });
  };

  return (
    <div style={styles.treeContainer}>
      <div style={styles.treeWrapper}>
        <h1 style={styles.header}>📂 My Documents</h1>

        {/* ➕ Toolbar */}
        <div style={styles.toolbar}>
          <button style={styles.button} onClick={addFile}>➕ Add File</button>
          <button style={styles.button} onClick={addFolder}>📁 Add Folder</button>
        </div>

        {/* Tree Rendering */}
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
