"use client";

import { useState, useRef } from "react";
import { Button } from "reactstrap";

interface StampJsonEditorProps {
  data: any;
  fileName?: string;
  onUpdate: (data: any) => void;
}

export function StampJsonEditor({ data, fileName, onUpdate }: StampJsonEditorProps): JSX.Element {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedValue, setEditedValue] = useState(JSON.stringify(data, null, 2));
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const readOnlyRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggleMode = () => {
    if (isEditMode) {
      // Switching from edit to view mode - reset changes
      setEditedValue(JSON.stringify(data, null, 2));
    }
    setIsEditMode(!isEditMode);
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editedValue);
      onUpdate?.(parsed);
      setIsEditMode(false);
    } catch (error) {
      alert("Invalid JSON format");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const handleReadOnlyClick = () => {
    if (readOnlyRef.current) {
      navigator.clipboard.writeText(readOnlyRef.current.value);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
  };

  const handleDownload = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    let downloadFileName = 'stamps.json';
    if (fileName) {
      downloadFileName = fileName.replace(/\.pdf$/i, '') + '.json';
    }

    link.href = url;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      alert('Please drop a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        onUpdate(parsed);
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const baseStyle = {
    fontSize: "0.8em",
    width: "98%",
    minHeight: "70vh",
    margin: "1%",
    cols: 60,
    rows: 35,
    fontFamily: "monospace",
  };

  const readOnlyStyle = {
    ...baseStyle,
    backgroundColor: copyFeedback ? "#d4edda" : "#ddd",
    color: "#000",
    border: copyFeedback ? "1px solid #28a745" : "1px solid #ddd",
    opacity: 0.9,
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const editableStyle = {
    ...baseStyle,
    backgroundColor: "#fffef0",
    color: "#000",
    border: "2px solid #4CAF50",
    boxShadow: "0 0 5px rgba(76, 175, 80, 0.3)",
    cursor: "text",
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: "relative",
        backgroundColor: isDragging ? "rgba(76, 175, 80, 0.1)" : "transparent",
        border: isDragging ? "2px dashed #4CAF50" : "none",
        borderRadius: "8px",
        transition: "all 0.2s ease",
      }}
    >
      {isDragging && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "20px 40px",
            borderRadius: "8px",
            fontSize: "1em",
            fontWeight: "bold",
            pointerEvents: "none",
            zIndex: 20,
          }}
        >
          Drop JSON file here
        </div>
      )}
      <div style={{ margin: "1%" }}>
        <div className="d-flex" style={{ gap: "0.5%", marginBottom: isEditMode ? "0.5%" : "0" }}>
          <Button
            onClick={handleToggleMode}
            color={isEditMode ? "warning" : "info"}
            style={{ flex: 1 }}
          >
            {isEditMode ? "Cancel" : "Edit"}
          </Button>
          {!isEditMode && (
            <Button
              onClick={handleDownload}
              color="success"
              style={{ flex: 1 }}
            >
              Download
            </Button>
          )}
        </div>
        {isEditMode && (
          <div style={{ fontSize: "0.8em", color: "#4CAF50", fontWeight: "bold" }}>
            Ctrl+Enter to save
          </div>
        )}
      </div>
      {isEditMode ? (
        <textarea
          onKeyDown={handleKeyDown}
          style={editableStyle}
          value={editedValue}
          onChange={(e) => setEditedValue(e.target.value)}
        />
      ) : (
        <div style={{ position: "relative" }}>
          <textarea
            ref={readOnlyRef}
            readOnly
            onClick={handleReadOnlyClick}
            style={readOnlyStyle}
            value={JSON.stringify(data, null, 2)}
          />
          {copyFeedback && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "#28a745",
                color: "white",
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "0.9em",
                fontWeight: "bold",
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              Copied!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
