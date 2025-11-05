"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { FileImage, FileText, Copy, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
}

export interface UploadedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  purpose: 'asset' | 'design-reference' | 'both' | 'pending';
  designAnalysis?: any;
  created?: string;
  updated?: string;
}

interface FileTreeProps {
  files: { name: string; content: string }[];
  onFileSelect: (file: { name: string; content: string }) => void;
  selectedFile: string | null;
  projectId?: string;
  uploadedFiles?: UploadedFile[];
  onRefreshUploadedFiles?: () => void;
}

// Get file icon based on extension - Enhanced with better designs
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'html':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    case 'css':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      );
    case 'js':
    case 'jsx':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 3h18v18H3V3zm16.525 13.707c-.131-.821-.666-1.511-2.252-2.155-.552-.259-1.165-.438-1.349-.854-.068-.248-.078-.382-.034-.529.113-.484.687-.629 1.137-.495.293.09.563.315.732.676.775-.507.775-.507 1.316-.844-.203-.314-.304-.451-.439-.586-.473-.528-1.103-.798-2.126-.775l-.528.067c-.507.124-.991.395-1.283.754-.855.968-.611 2.655.427 3.354 1.023.765 2.521.933 2.712 1.653.18.878-.652 1.159-1.475 1.058-.607-.136-.945-.439-1.316-1.002l-1.372.788c.157.359.337.517.607.832 1.305 1.316 4.568 1.249 5.153-.754.021-.067.18-.528.056-1.237l.034.049zm-6.737-5.434h-1.686c0 1.453-.007 2.898-.007 4.354 0 .924.047 1.772-.104 2.033-.247.517-.886.451-1.175.359-.297-.146-.448-.349-.623-.641-.047-.078-.082-.146-.095-.146l-1.368.844c.229.473.563.879.994 1.137.641.383 1.502.507 2.404.305.588-.17 1.095-.519 1.358-1.059.384-.697.302-1.553.299-2.509.008-1.541 0-3.083 0-4.635l.003-.042z"/>
        </svg>
      );
    case 'ts':
    case 'tsx':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/>
        </svg>
      );
    case 'json':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'md':
    case 'mdx':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'svg':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'xml':
    case 'yaml':
    case 'yml':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
  }
};

// Get file extension color
const getFileColor = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'html':
      return 'text-orange-400';
    case 'css':
      return 'text-blue-400';
    case 'js':
    case 'jsx':
      return 'text-yellow-400';
    case 'ts':
    case 'tsx':
      return 'text-blue-500';
    case 'json':
      return 'text-green-400';
    case 'md':
      return 'text-gray-400';
    default:
      return 'text-text-tertiary';
  }
};

// Sort function: folders first, then files alphabetically
const sortNodes = (nodes: FileNode[]): FileNode[] => {
  return nodes.sort((a, b) => {
    // Folders come before files
    if (a.type === 'folder' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'folder') return 1;
    // Within same type, sort alphabetically (case-insensitive)
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
};

// Apply sorting recursively to all levels
const sortRecursive = (nodes: FileNode[]): FileNode[] => {
  const sorted = sortNodes(nodes);
  sorted.forEach(node => {
    if (node.children) {
      node.children = sortRecursive(node.children);
    }
  });
  return sorted;
};

// Build file tree structure from flat file list
const buildFileTreeFromFiles = (files: { name: string; content: string }[]): FileNode[] => {
  const root: FileNode[] = [];

  files.forEach((file) => {
    const parts = file.name.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const path = parts.slice(0, index + 1).join("/");

      let existingNode = currentLevel.find((node) => node.name === part);

      if (!existingNode) {
        const newNode: FileNode = {
          name: part,
          path,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
          content: isFile ? file.content : undefined,
        };
        currentLevel.push(newNode);
        existingNode = newNode;
      }

      if (!isFile && existingNode.children) {
        currentLevel = existingNode.children;
      }
    });
  });

  // Sort the tree with folders first
  return sortRecursive(root);
};

const FileTree = memo(function FileTree({ files, onFileSelect, selectedFile, projectId, uploadedFiles = [], onRefreshUploadedFiles }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]));
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showUploadedFiles, setShowUploadedFiles] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState<string>('');

  // Memoize file tree building - only rebuild when files change
  const fileTree = useMemo(() => buildFileTreeFromFiles(files), [files]);

  // Memoize total files count
  const totalFiles = useMemo(() => files.length, [files.length]);

  // Memoize toggle folder function
  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Memoize filter function
  const filterNode = useCallback((node: FileNode): boolean => {
    if (!searchTerm) return true;
    if (node.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
    if (node.children) {
      return node.children.some(filterNode);
    }
    return false;
  }, [searchTerm]);

  // Memoize file selection handler
  const handleFileSelect = useCallback((path: string, content: string) => {
    onFileSelect({ name: path, content });
  }, [onFileSelect]);

  // File operations handlers
  const handleCopyPath = useCallback((fileUrl: string) => {
    navigator.clipboard.writeText(fileUrl);
    console.log('✅ File URL copied to clipboard');
  }, []);

  const handleStartRename = useCallback((fileId: string, currentName: string) => {
    setEditingFileId(fileId);
    setEditingFileName(currentName);
  }, []);

  const handleSaveRename = useCallback(async (fileId: string) => {
    if (!editingFileName.trim() || !projectId) return;

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: editingFileName })
      });

      if (!response.ok) {
        throw new Error('Failed to rename file');
      }

      console.log('✅ File renamed successfully');
      setEditingFileId(null);
      setEditingFileName('');

      if (onRefreshUploadedFiles) {
        onRefreshUploadedFiles();
      }
    } catch (error: any) {
      console.error('Rename error:', error);
      alert(error.message || 'Failed to rename file');
    }
  }, [editingFileName, projectId, onRefreshUploadedFiles]);

  const handleCancelRename = useCallback(() => {
    setEditingFileId(null);
    setEditingFileName('');
  }, []);

  const handleDeleteFile = useCallback(async (fileId: string) => {
    if (!confirm('Delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      console.log('✅ File deleted successfully');

      if (onRefreshUploadedFiles) {
        onRefreshUploadedFiles();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.message || 'Failed to delete file');
    }
  }, [onRefreshUploadedFiles]);

  // Memoize render node function
  const renderNode = useCallback((node: FileNode, depth: number = 0): React.ReactElement | null => {
    if (!filterNode(node)) return null;

    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;
    const isHovered = hoveredItem === node.path;

    if (node.type === "folder") {
      return (
        <div key={node.path}>
          <div
            onClick={() => toggleFolder(node.path)}
            onMouseEnter={() => setHoveredItem(node.path)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-lg transition-all group ${
              isHovered ? "bg-gradient-to-r from-amber-400/5 to-yellow-400/5" : ""
            }`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            <svg
              className={`w-4 h-4 text-text-secondary transition-all flex-shrink-0 ${
                isExpanded ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <svg
              className={`w-4 h-4 flex-shrink-0 transition-colors ${
                isExpanded ? "text-blue-500" : "text-blue-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isExpanded ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              )}
            </svg>
            <span className={`text-sm font-medium ${isExpanded ? "text-text-primary" : "text-text-secondary"}`}>
              {node.name}
            </span>
            {node.children && (
              <span className="ml-auto text-xs text-text-tertiary">{node.children.length}</span>
            )}
          </div>
          {isExpanded && node.children && (
            <div className="mt-0.5">{node.children.map((child) => renderNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    // File node
    const fileColor = getFileColor(node.name);
    const fileIcon = getFileIcon(node.name);

    return (
      <div
        key={node.path}
        onClick={() => handleFileSelect(node.path, node.content || "")}
        onMouseEnter={() => setHoveredItem(node.path)}
        onMouseLeave={() => setHoveredItem(null)}
        className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-lg transition-all group ${
          isSelected
            ? "bg-gradient-to-r from-amber-400/10 to-yellow-400/10 border-l-2 border-amber-500"
            : isHovered
            ? "bg-background-subtle"
            : ""
        }`}
        style={{ paddingLeft: `${depth * 16 + 28}px` }}
      >
        <div className={fileColor}>
          {fileIcon}
        </div>
        <span className={`text-sm truncate ${isSelected ? "text-amber-500 font-medium" : "text-text-primary"}`}>
          {node.name}
        </span>
        {isSelected && (
          <div className="ml-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
          </div>
        )}
      </div>
    );
  }, [filterNode, expandedFolders, selectedFile, hoveredItem, toggleFolder, handleFileSelect]);

  return (
    <div className="h-full flex flex-col bg-background-raised border-r border-light">
      {/* Header with Search */}
      <div className="p-4 border-b border-light bg-gradient-to-br from-background-raised to-background-subtle">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd"/>
              <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-text-primary">Explorer</h3>
            <p className="text-xs text-text-tertiary">{totalFiles} {totalFiles === 1 ? 'file' : 'files'}</p>
          </div>
        </div>

        <div className="relative">
          <svg className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-background-base border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-text-primary placeholder-text-tertiary transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {fileTree.length > 0 ? (
          <div className="space-y-0.5">
            {fileTree.map((node) => renderNode(node, 0))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
            <svg className="w-12 h-12 text-text-tertiary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-text-tertiary text-sm font-medium">No files found</p>
            {searchTerm && (
              <p className="text-text-tertiary text-xs mt-1">Try a different search term</p>
            )}
          </div>
        )}
      </div>

      {/* Uploaded Files Section (Bottom) */}
      {projectId && (
        <div className="border-t border-light bg-background-base">
          {/* Clickable Header */}
          <button
            onClick={() => setShowUploadedFiles(!showUploadedFiles)}
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-background-subtle transition-colors"
          >
            <FileImage className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-sm font-medium text-text-primary flex-1 text-left">
              Uploaded Files
            </span>
            <span className="text-xs text-text-tertiary mr-2">
              {uploadedFiles.length}
            </span>
            {showUploadedFiles ? (
              <ChevronUp className="w-4 h-4 text-text-secondary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            )}
          </button>

          {/* Expandable Files List */}
          {showUploadedFiles && (
            <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar border-t border-light">
              {uploadedFiles.length > 0 ? (
                <div className="space-y-1">
                  {uploadedFiles.map((file) => {
                  const isEditing = editingFileId === file.id;

                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-background-subtle transition-all group"
                    >
                      {/* File Icon */}
                      <div className="w-8 h-8 rounded-lg bg-gradient-brand-br flex items-center justify-center flex-shrink-0">
                        {file.fileType.startsWith('image/') ? (
                          <FileImage className="w-4 h-4 text-white" />
                        ) : (
                          <FileText className="w-4 h-4 text-white" />
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingFileName}
                            onChange={(e) => setEditingFileName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(file.id);
                              if (e.key === 'Escape') handleCancelRename();
                            }}
                            className="w-full px-2 py-1 text-xs font-medium bg-background-base border border-amber-400 rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-400/20"
                            autoFocus
                          />
                        ) : (
                          <div className="text-xs font-medium text-text-primary truncate">
                            {file.fileName}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveRename(file.id)}
                              className="p-1 rounded text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                              title="Save"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={handleCancelRename}
                              className="p-1 rounded text-text-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Cancel"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleCopyPath(file.fileUrl)}
                              className="p-1 rounded text-text-tertiary hover:text-amber-400 hover:bg-background-base transition-colors"
                              title="Copy path"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleStartRename(file.id, file.fileName)}
                              className="p-1 rounded text-text-tertiary hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Rename"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="p-1 rounded text-text-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                  <FileImage className="w-8 h-8 text-text-tertiary mb-2" />
                  <p className="text-text-tertiary text-xs">No uploaded files yet</p>
                  <p className="text-text-tertiary text-xs mt-1">Use the attachment button in chat</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(163, 163, 163, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(163, 163, 163, 0.5);
        }
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.files === nextProps.files &&
    prevProps.selectedFile === nextProps.selectedFile &&
    prevProps.onFileSelect === nextProps.onFileSelect
  );
});

export default FileTree;
