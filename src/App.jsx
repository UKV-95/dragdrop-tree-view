import React, { useState } from "react";

// 🎨 CSS
const styles = {
  treeContainer: {
    minHeight: "100vh",
    backgroundColor: "#f4f6f8",
    padding: "30px 16px",
    fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
  },
  treeWrapper: {
    maxWidth: 600,
    margin: "0 auto",
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  toolbar: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  button: {
    padding: "8px 14px",
    border: "1px solid #ddd",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    cursor: "pointer",
    transition: "0.2s",
    fontSize: 14,
  },
  node: {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    margin: "2px 0",
    borderRadius: 6,
    transition: "background-color 0.2s",
    cursor: "grab",
  },
  nodeHover: {
    backgroundColor: "#f1f5f9",
  },
  nodeDragging: {
    opacity: 0.5,
  },
  nodeDropping: {
    backgroundColor: "#e1f0ff",
    boxShadow: "inset 0 0 0 2px #3399ff",
  },
  childrenWrapper: {
    marginLeft: 18,
    borderLeft: "2px solid #e5e7eb",
    paddingLeft: 12,
  },
};

//  TreeNode component
const TreeNode = ({ node, treeData, setTreeData }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hover, setHover] = useState(false);

  //  Utility functions
  const removeNode = (nodes, id) =>
    nodes.reduce((acc, curr) => {
      if (curr.id === id) return acc;
      if (curr.children) curr = { ...curr, children: removeNode(curr.children, id) };
      acc.push(curr);
      return acc;
    }, []);

  const addNode = (nodes, targetId, item) =>
    nodes.map((curr) => {
      if (curr.id === targetId) {
        return { ...curr, children: [...(curr.children || []), item] };
      }
      if (curr.children) return { ...curr, children: addNode(curr.children, targetId, item) };
      return curr;
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

  // Check if a node is a descendant of another)
  const isDescendant = (parent, childId) => {
    if (!parent.children) return false;
    for (const c of parent.children) {
      if (c.id === childId || isDescendant(c, childId)) return true;
    }
    return false;
  };

  
  const handleDragStart = (e) => {
    e.dataTransfer.setData("nodeId", node.id);
    setIsDragging(true);
  };
  const handleDragEnd = () => setIsDragging(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (node.type === "folder") setIsDropping(true);
  };
  const handleDragLeave = () => setIsDropping(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDropping(false);

    const draggedId = e.dataTransfer.getData("nodeId");
    if (draggedId === node.id) return; // can’t drop onto itself

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
    } else {
      
      setTreeData(treeData);
    }
  };

  return (
    <div>
      {/* Node */}
      <div
        draggable
        style={{
          ...styles.node,
          ...(hover ? styles.nodeHover : {}),
          ...(isDragging ? styles.nodeDragging : {}),
          ...(isDropping ? styles.nodeDropping : {}),
        }}
        onClick={node.type === "folder" ? () => setCollapsed(!collapsed) : undefined}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {node.type === "folder" ? (collapsed ? "📁▶" : "📂▼") : "📄"}{" "}
        <span style={{ marginLeft: 8 }}>{node.label}</span>
      </div>

      {/* Children */}
      {!collapsed && node.children && node.children.length > 0 && (
        <div style={styles.childrenWrapper}>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} treeData={treeData} setTreeData={setTreeData} />
          ))}
        </div>
      )}
    </div>
  );
};

// 📦 Main App component
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
            { id: "1-1-2", label: "ProjectPlan.pdf", type: "file" },
          ],
        },
        { id: "1-2", label: "Personal", type: "folder", children: [] },
      ],
    },
  ]);

  // ➕ Add file
  const addFile = () => {
    const name = prompt("Enter file name:");
    if (!name) return;
    setTreeData((prev) =>
      prev.map((node) =>
        node.id === "1"
          ? { ...node, children: [...node.children, { id: Date.now().toString(), label: name, type: "file" }] }
          : node
      )
    );
  };

  // 📁 Add folder
  const addFolder = () => {
    const name = prompt("Enter folder name:");
    if (!name) return;
    setTreeData((prev) =>
      prev.map((node) =>
        node.id === "1"
          ? {
              ...node,
              children: [
                ...node.children,
                { id: Date.now().toString(), label: name, type: "folder", children: [] },
              ],
            }
          : node
      )
    );
  };

  return (
    <div style={styles.treeContainer}>
      <div style={styles.treeWrapper}>
        <h1 style={styles.header}>📂 My Documents</h1>

        {/* Toolbar */}
        <div style={styles.toolbar}>
          <button style={styles.button} onClick={addFile}>➕ Add File</button>
          <button style={styles.button} onClick={addFolder}>📁 Add Folder</button>
        </div>

        {/* Render tree */}
        {treeData.map((node) => (
          <TreeNode key={node.id} node={node} treeData={treeData} setTreeData={setTreeData} />
        ))}
      </div>
    </div>
  );
};

export default App;
