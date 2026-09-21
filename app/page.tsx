"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";

type Folder = {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
};

type CloudFile = {
  id: string;
  name: string;
  folder_id: string | null;
  storage_key: string;
  mime_type: string | null;
  size_bytes: number | null;
  is_deleted: boolean;
  created_at: string;
};

type Share = {
  id: string;
  resource_type: string;
  resource_id: string;
  grantee_user_id: string;
  role: string;
  created_by: string;
  created_at: string;
};

type PublicLink = {
  id: string;
  resource_type: string;
  resource_id: string;
  token: string;
  role: string;
  expires_at: string | null;
  created_by: string;
  created_at: string;
};

type ViewMode =
  | "drive"
  | "trash"
  | "starred"
  | "shared"
  | "recent";

type FolderLocation = {
  id: string | null;
  name: string;
};

export default function Home() {
  const supabase = createClient();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // ==========================================
  // DATA
  // ==========================================

  const [folders, setFolders] =
    useState<Folder[]>([]);

  const [allFolders, setAllFolders] =
    useState<Folder[]>([]);

  const [files, setFiles] =
    useState<CloudFile[]>([]);

  const [sharedFiles, setSharedFiles] =
    useState<CloudFile[]>([]);

  const [recentFiles, setRecentFiles] =
    useState<CloudFile[]>([]);

  const [starredIds, setStarredIds] =
    useState<string[]>([]);

  // ==========================================
  // CURRENT FOLDER
  // ==========================================

  const [currentFolderId, setCurrentFolderId] =
    useState<string | null>(null);

  const [currentFolderName, setCurrentFolderName] =
    useState("My Drive");

  // ==========================================
  // FOLDER CREATE
  // ==========================================

  const [folderName, setFolderName] =
    useState("");

  const [showFolderInput, setShowFolderInput] =
    useState(false);

  // ==========================================
  // SEARCH
  // ==========================================

  const [searchQuery, setSearchQuery] =
    useState("");

  // ==========================================
  // VIEW MODE
  // ==========================================

  const [viewMode, setViewMode] =
    useState<ViewMode>("drive");

  // ==========================================
  // FOLDER HISTORY
  // ==========================================

  const [folderHistory, setFolderHistory] =
    useState<FolderLocation[]>([
      {
        id: null,
        name: "My Drive",
      },
    ]);

  const [historyIndex, setHistoryIndex] =
    useState(0);

  // ==========================================
  // VIEW / PREVIEW
  // ==========================================

  async function viewFile(file: CloudFile) {
    const { data, error } = await supabase.storage
      .from("drive")
      .createSignedUrl(file.storage_key, 300);

    if (error) {
      setMessage("View error: " + error.message);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  // ==========================================
  // RENAME
  // ==========================================

  const [renamingFile, setRenamingFile] =
    useState<CloudFile | null>(null);

  const [renameName, setRenameName] =
    useState("");

  const [renaming, setRenaming] =
    useState(false);

  // ==========================================
  // MOVE
  // ==========================================

  const [movingFile, setMovingFile] =
    useState<CloudFile | null>(null);

  const [moveTargetId, setMoveTargetId] =
    useState("");

  const [moving, setMoving] =
    useState(false);

  // ==========================================
  // SHARING
  // ==========================================

  const [sharingFile, setSharingFile] =
    useState<CloudFile | null>(null);

  const [shareEmail, setShareEmail] =
    useState("");

  const [shareRole, setShareRole] =
    useState<"viewer" | "editor">(
      "viewer"
    );

  const [sharing, setSharing] =
    useState(false);

  const [fileShares, setFileShares] =
    useState<Share[]>([]);

  const [loadingShares, setLoadingShares] =
    useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // ==========================================
  // PUBLIC LINK
  // ==========================================

  const [publicLink, setPublicLink] =
    useState<PublicLink | null>(null);

  const [publicLinkExpiry, setPublicLinkExpiry] =
    useState<"never" | "1h" | "1d" | "7d">("never");

  const [publicLinkPassword, setPublicLinkPassword] =
    useState("");

  const [creatingPublicLink, setCreatingPublicLink] =
    useState(false);

  const [loadingPublicLink, setLoadingPublicLink] =
    useState(false);

  const [copyingPublicLink, setCopyingPublicLink] =
    useState(false);

  const [revokingPublicLink, setRevokingPublicLink] =
    useState(false);

  // ==========================================
  // GENERAL
  // ==========================================

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [userEmail, setUserEmail] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [showProfile, setShowProfile] =
    useState(false);

  // ==========================================
  // GET CURRENT USER
  // ==========================================

  async function getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return null;
    }

    setUserEmail(user.email ?? "");

    return user;
  }

  // ==========================================
  // LOAD DRIVE
  // ==========================================

  async function loadDrive(
    folderId: string | null
  ) {
    const user = await getCurrentUser();

    if (!user) return;

    let folderQuery = supabase
      .from("folders")
      .select(
        "id, name, parent_id, created_at"
      )
      .eq("owner_id", user.id);

    if (folderId === null) {
      folderQuery =
        folderQuery.is(
          "parent_id",
          null
        );
    } else {
      folderQuery =
        folderQuery.eq(
          "parent_id",
          folderId
        );
    }

    const {
      data: folderData,
      error: folderError,
    } =
      await folderQuery.order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (folderError) {
      console.error(
        "Folder load error:",
        folderError
      );

      setMessage(
        "Folder load error: " +
          folderError.message
      );

      return;
    }

    let fileQuery = supabase
      .from("files")
      .select(
        "id, name, folder_id, storage_key, mime_type, size_bytes, is_deleted, created_at"
      )
      .eq("owner_id", user.id)
      .eq("is_deleted", false);

    if (folderId === null) {
      fileQuery =
        fileQuery.is(
          "folder_id",
          null
        );
    } else {
      fileQuery =
        fileQuery.eq(
          "folder_id",
          folderId
        );
    }

    const {
      data: fileData,
      error: fileError,
    } =
      await fileQuery.order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (fileError) {
      console.error(
        "File load error:",
        fileError
      );

      setMessage(
        "File load error: " +
          fileError.message
      );

      return;
    }

    setFolders(folderData ?? []);
    setFiles(fileData ?? []);
  }

  // ==========================================
  // LOAD ALL FOLDERS
  // ==========================================

  async function loadAllFolders() {
    const user = await getCurrentUser();

    if (!user) return;

    const {
      data,
      error,
    } = await supabase
      .from("folders")
      .select(
        "id, name, parent_id, created_at"
      )
      .eq("owner_id", user.id)
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error(
        "All folders error:",
        error
      );

      return;
    }

    setAllFolders(data ?? []);
  }

  // ==========================================
  // LOAD TRASH
  // ==========================================

  async function loadTrash() {
    const user = await getCurrentUser();

    if (!user) return;

    const {
      data,
      error,
    } = await supabase
      .from("files")
      .select(
        "id, name, folder_id, storage_key, mime_type, size_bytes, is_deleted, created_at"
      )
      .eq("owner_id", user.id)
      .eq("is_deleted", true)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Trash load error:",
        error
      );

      setMessage(
        "Trash load error: " +
          error.message
      );

      return;
    }

    setFolders([]);
    setFiles(data ?? []);
  }

  // ==========================================
  // OPEN TRASH
  // ==========================================

  async function openTrash() {
    setViewMode("trash");

    setCurrentFolderId(null);
    setCurrentFolderName("Trash");

    setSearchQuery("");
    setShowFolderInput(false);
    setMovingFile(null);
    setRenamingFile(null);
    setSharingFile(null);
    setMessage("");

    await loadTrash();
  }

  // ==========================================
  // LOAD STARS
  // ==========================================

  async function loadStars() {
    const user = await getCurrentUser();

    if (!user) return;

    const {
      data,
      error,
    } = await supabase
      .from("stars")
      .select("resource_id")
      .eq("user_id", user.id)
      .eq(
        "resource_type",
        "file"
      );

    if (error) {
      console.error(
        "Load stars error:",
        error
      );

      setMessage(
        "Star load error: " +
          error.message
      );

      return;
    }

    setStarredIds(
      (data ?? []).map(
        (item) =>
          item.resource_id
      )
    );
  }

  // ==========================================
  // OPEN STARRED
  // ==========================================

  async function openStarred() {
    const user = await getCurrentUser();

    if (!user) return;

    setViewMode("starred");

    setCurrentFolderId(null);
    setCurrentFolderName("Starred");

    setSearchQuery("");
    setShowFolderInput(false);
    setMovingFile(null);
    setRenamingFile(null);
    setSharingFile(null);
    setMessage("");

    const {
      data: stars,
      error: starError,
    } =
      await supabase
        .from("stars")
        .select("resource_id")
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "resource_type",
          "file"
        );

    if (starError) {
      console.error(
        "Starred page error:",
        starError
      );

      setMessage(
        "Starred load error: " +
          starError.message
      );

      return;
    }

    const ids =
      (stars ?? []).map(
        (item) =>
          item.resource_id
      );

    setStarredIds(ids);

    if (ids.length === 0) {
      setFiles([]);
      setFolders([]);
      return;
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("files")
        .select(
          "id, name, folder_id, storage_key, mime_type, size_bytes, is_deleted, created_at"
        )
        .eq(
          "owner_id",
          user.id
        )
        .eq(
          "is_deleted",
          false
        )
        .in(
          "id",
          ids
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        "Starred files error:",
        error
      );

      setMessage(
        "Starred files error: " +
          error.message
      );

      return;
    }

    setFiles(data ?? []);
    setFolders([]);
  }

  // ==========================================
  // TOGGLE STAR
  // ==========================================

  async function toggleStar(
    file: CloudFile
  ) {
    const user = await getCurrentUser();

    if (!user) return;

    const isStarred =
      starredIds.includes(
        file.id
      );

    // REMOVE STAR
    if (isStarred) {
      const {
        error,
      } =
        await supabase
          .from("stars")
          .delete()
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "resource_type",
            "file"
          )
          .eq(
            "resource_id",
            file.id
          );

      if (error) {
        console.error(
          "Remove star error:",
          error
        );

        setMessage(
          "Remove Star error: " +
            error.message
        );

        return;
      }

      setStarredIds(
        (current) =>
          current.filter(
            (id) =>
              id !== file.id
          )
      );

      if (
        viewMode ===
        "starred"
      ) {
        setFiles(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                file.id
            )
        );
      }

      setMessage(
        `"${file.name}" removed from Starred.`
      );

      return;
    }

    // ADD STAR
    const {
      error,
    } =
      await supabase
        .from("stars")
        .insert({
          user_id: user.id,
          resource_type:
            "file",
          resource_id:
            file.id,
        });

    if (error) {
      console.error(
        "Add star error:",
        error
      );

      setMessage(
        "Add Star error: " +
          error.message
      );

      return;
    }

    setStarredIds(
      (current) =>
        current.includes(
          file.id
        )
          ? current
          : [
              ...current,
              file.id,
            ]
    );

    setMessage(
      `"${file.name}" added to Starred ⭐`
    );
  }

  // ==========================================
  // OPEN SHARED
  // ==========================================

  async function openShared() {
    setViewMode("shared");

    setCurrentFolderId(null);
    setCurrentFolderName("Shared");

    setSearchQuery("");
    setShowFolderInput(false);
    setMovingFile(null);
    setRenamingFile(null);
    setSharingFile(null);
    setMessage("");

    await loadSharedFiles();
  }

  // ==========================================
  // LOAD SHARED FILES
  // ==========================================

  async function loadSharedFiles() {
    const user = await getCurrentUser();

    if (!user) return;

    const {
      data: shares,
      error: shareError,
    } =
      await supabase
        .from("shares")
        .select(
          "id, resource_type, resource_id, grantee_user_id, role, created_by, created_at"
        )
        .eq(
          "grantee_user_id",
          user.id
        )
        .eq(
          "resource_type",
          "file"
        );

    if (shareError) {
      console.error(
        "Shared query error:",
        shareError
      );

      setMessage(
        "Shared files error: " +
          shareError.message
      );

      return;
    }

    const ids =
      (shares ?? []).map(
        (share) =>
          share.resource_id
      );

    if (ids.length === 0) {
      setSharedFiles([]);
      return;
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("files")
        .select(
          "id, name, folder_id, storage_key, mime_type, size_bytes, is_deleted, created_at"
        )
        .in(
          "id",
          ids
        )
        .eq(
          "is_deleted",
          false
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        "Shared files query error:",
        error
      );

      setMessage(
        "Shared files query error: " +
          error.message
      );

      return;
    }

    setSharedFiles(
      data ?? []
    );
  }

  // ==========================================
  // RECENT
  // ==========================================

  async function openRecent() {
    const user = await getCurrentUser();
    if (!user) return;

    setViewMode("recent");
    setCurrentFolderId(null);
    setCurrentFolderName("Recent");
    setSearchQuery("");
    setShowFolderInput(false);
    setMovingFile(null);
    setRenamingFile(null);
    setSharingFile(null);
    setMessage("");

    const { data, error } = await supabase
      .from("files")
      .select("id, name, folder_id, storage_key, mime_type, size_bytes, is_deleted, created_at")
      .eq("owner_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setMessage("Recent files error: " + error.message);
      return;
    }

    setRecentFiles(data ?? []);
    setFiles(data ?? []);
    setFolders([]);
  }

  // ==========================================
  // NAVIGATION
  // ==========================================

  async function navigateToFolder(
    folderId: string | null,
    folderName: string,
    addToHistory = true
  ) {
    setViewMode("drive");

    setCurrentFolderId(
      folderId
    );

    setCurrentFolderName(
      folderName
    );

    setSearchQuery("");
    setShowFolderInput(false);
    setMovingFile(null);
    setRenamingFile(null);
    setSharingFile(null);
    setMessage("");

    if (addToHistory) {
      const current =
        folderHistory[
          historyIndex
        ];

      if (
        current?.id ===
        folderId
      ) {
        await loadDrive(
          folderId
        );

        return;
      }

      const newHistory =
        folderHistory.slice(
          0,
          historyIndex + 1
        );

      newHistory.push({
        id: folderId,
        name: folderName,
      });

      setFolderHistory(
        newHistory
      );

      setHistoryIndex(
        newHistory.length - 1
      );
    }

    await loadDrive(
      folderId
    );
  }

  async function openFolder(
    folder: Folder
  ) {
    await navigateToFolder(
      folder.id,
      folder.name
    );
  }

  async function goToMyDrive() {
    await navigateToFolder(
      null,
      "My Drive"
    );
  }

  async function goBack() {
    if (historyIndex <= 0) {
      return;
    }

    const newIndex =
      historyIndex - 1;

    const location =
      folderHistory[newIndex];

    setHistoryIndex(
      newIndex
    );

    setViewMode("drive");

    setCurrentFolderId(
      location.id
    );

    setCurrentFolderName(
      location.name
    );

    setSearchQuery("");
    setMessage("");

    await loadDrive(
      location.id
    );
  }

  async function goForward() {
    if (
      historyIndex >=
      folderHistory.length - 1
    ) {
      return;
    }

    const newIndex =
      historyIndex + 1;

    const location =
      folderHistory[newIndex];

    setHistoryIndex(
      newIndex
    );

    setViewMode("drive");

    setCurrentFolderId(
      location.id
    );

    setCurrentFolderName(
      location.name
    );

    setSearchQuery("");
    setMessage("");

    await loadDrive(
      location.id
    );
  }

  // ==========================================
  // CREATE FOLDER
  // ==========================================
    // ==========================================
// RENAME FOLDER
// ==========================================
async function renameFolder(folder: Folder) {
  const newName = window.prompt(
    "Enter new folder name:",
    folder.name
  );

  if (newName === null) return;

  const name = newName.trim();

  if (!name) {
    setMessage("Folder name cannot be empty.");
    return;
  }

  if (name === folder.name) return;

  const user = await getCurrentUser();

  if (!user) return;

  const { error } = await supabase
    .from("folders")
    .update({ name })
    .eq("id", folder.id)
    .eq("owner_id", user.id);

  if (error) {
    setMessage("Rename folder error: " + error.message);
    return;
  }

  setFolders((current) =>
    current.map((item) =>
      item.id === folder.id
        ? { ...item, name }
        : item
    )
  );

  setAllFolders((current) =>
    current.map((item) =>
      item.id === folder.id
        ? { ...item, name }
        : item
    )
  );

  setMessage(`Folder renamed to "${name}".`);
}


// ==========================================
// DELETE FOLDER
// ==========================================
async function deleteFolder(folder: Folder) {
  const user = await getCurrentUser();

  if (!user) return;

  const { count: fileCount, error: fileError } = await supabase
    .from("files")
    .select("id", { count: "exact", head: true })
    .eq("folder_id", folder.id)
    .eq("owner_id", user.id)
    .eq("is_deleted", false);

  if (fileError) {
    setMessage("Could not check folder files.");
    return;
  }

  const { count: childCount, error: childError } = await supabase
    .from("folders")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", folder.id)
    .eq("owner_id", user.id);

  if (childError) {
    setMessage("Could not check subfolders.");
    return;
  }

  if ((fileCount ?? 0) > 0 || (childCount ?? 0) > 0) {
    setMessage(
      `"${folder.name}" is not empty. Move its files and folders first.`
    );
    return;
  }

  const confirmed = window.confirm(
    `Delete folder "${folder.name}"?`
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", folder.id)
    .eq("owner_id", user.id);

  if (error) {
    setMessage("Delete folder error: " + error.message);
    return;
  }

  setFolders((current) =>
    current.filter((item) => item.id !== folder.id)
  );

  setAllFolders((current) =>
    current.filter((item) => item.id !== folder.id)
  );

  setMessage(`Folder "${folder.name}" deleted.`);
}
     async function createFolder() {
    if (viewMode !== "drive") {
      return;
    }

    const name = folderName.trim();

    if (!name) {
      setMessage("Please enter a folder name.");
      return;
    }

    const user = await getCurrentUser();

    if (!user) {
      return;
    }

    // Check if a folder with the same name already exists
    // inside the current folder.
    const { data: existingFolder, error: checkError } =
      await supabase
        .from("folders")
        .select("id")
        .eq("owner_id", user.id)
        .eq("parent_id", currentFolderId)
        .ilike("name", name)
        .maybeSingle();

    if (checkError) {
      console.error("Folder check error:", checkError);

      setMessage(
        "Could not check existing folders: " +
          checkError.message
      );

      return;
    }

    if (existingFolder) {
      setMessage(
        `A folder named "${name}" already exists here.`
      );

      return;
    }

    const { error } = await supabase
      .from("folders")
      .insert({
        name,
        owner_id: user.id,
        parent_id: currentFolderId,
      });

    if (error) {
      console.error("Create folder error:", error);

      setMessage(
        "Create folder error: " +
          error.message
      );

      return;
    }

    setFolderName("");
    setShowFolderInput(false);

    setMessage(
      `Folder "${name}" created successfully! ✅`
    );

    await loadDrive(currentFolderId);
  }
  

   
   
  // ==========================================
  // UPLOAD
  // ==========================================

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function uploadFile(
    file: File
  ) {
    if (
      viewMode !==
      "drive"
    ) {
      return;
    }

    const user =
      await getCurrentUser();

    if (!user) return;

    setUploading(true);

    setMessage(
      `Uploading "${file.name}"...`
    );

    const fileId =
      crypto.randomUUID();

    const safeName =
      file.name.replace(
        /[^\w.\-() ]/g,
        "_"
      );

    const storagePath =
      `${user.id}/${
        currentFolderId ??
        "root"
      }/${fileId}-${safeName}`;

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from("drive")
        .upload(
          storagePath,
          file,
          {
            contentType:
              file.type ||
              "application/octet-stream",
            upsert:
              false,
          }
        );

    if (uploadError) {
      console.error(
        "Upload error:",
        uploadError
      );

      setMessage(
        "Upload error: " +
          uploadError.message
      );

      setUploading(false);

      return;
    }

    const {
      error: dbError,
    } =
      await supabase
        .from("files")
        .insert({
          id: fileId,
          owner_id:
            user.id,
          folder_id:
            currentFolderId,
          name:
            file.name,
          storage_key:
            storagePath,
          mime_type:
            file.type ||
            "application/octet-stream",
          size_bytes:
            file.size,
          is_deleted:
            false,
        });

    if (dbError) {
      console.error(
        "File DB error:",
        dbError
      );

      await supabase.storage
        .from("drive")
        .remove([
          storagePath,
        ]);

      setMessage(
        "File database error: " +
          dbError.message
      );

      setUploading(false);

      return;
    }

    setMessage(
      `"${file.name}" uploaded successfully! ✅`
    );

    await loadDrive(
      currentFolderId
    );

    setUploading(false);
  }

  async function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    await uploadFile(file);

    event.target.value = "";
  }

  // ==========================================
  // DOWNLOAD
  // ==========================================

  async function downloadFile(file: CloudFile) {
  try {
    setMessage(`Preparing "${file.name}" for download...`);

    const { data, error } = await supabase.storage
  .from("drive")
  .createSignedUrl(file.storage_key, 60, {
    download: file.name,
  });


    if (error || !data?.signedUrl) {
      console.error("Download error:", error);
      setMessage(
        "Download error: " +
          (error?.message || "Could not create download URL.")
      );
      return;
    }

    const response = await fetch(data.signedUrl);

    if (!response.ok) {
      throw new Error(`Download failed (${response.status})`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = file.name;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(blobUrl);

    setMessage(`"${file.name}" downloaded successfully. ✅`);
  } catch (error) {
    console.error("Download error:", error);

    setMessage(
      "Download error: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
}
  // ==========================================
  // VIEW / PREVIEW
  // ==========================================

  // ==========================================
  // RENAME
  // ==========================================

  function openRenameDialog(
    file: CloudFile
  ) {
    setRenamingFile(file);
    setRenameName(file.name);
    setMessage("");
  }

  function closeRenameDialog() {
    if (renaming) return;

    setRenamingFile(null);
    setRenameName("");
  }

  async function renameFile() {
    if (!renamingFile) return;

    const newName =
      renameName.trim();

    if (!newName) {
      setMessage(
        "File name cannot be empty."
      );

      return;
    }

    if (
      newName ===
      renamingFile.name
    ) {
      closeRenameDialog();
      return;
    }

    const user =
      await getCurrentUser();

    if (!user) return;

    setRenaming(true);

    const safeName =
      newName.replace(
        /[^\w.\-() ]/g,
        "_"
      );

    const newPath =
      `${user.id}/${
        renamingFile.folder_id ??
        "root"
      }/${renamingFile.id}-${safeName}`;

    const {
      error: storageError,
    } =
      await supabase.storage
        .from("drive")
        .move(
          renamingFile.storage_key,
          newPath
        );

    if (storageError) {
      setMessage(
        "Rename storage error: " +
          storageError.message
      );

      setRenaming(false);

      return;
    }

    const {
      error: dbError,
    } =
      await supabase
        .from("files")
        .update({
          name: newName,
          storage_key:
            newPath,
        })
        .eq(
          "id",
          renamingFile.id
        )
        .eq(
          "owner_id",
          user.id
        );

    if (dbError) {
      await supabase.storage
        .from("drive")
        .move(
          newPath,
          renamingFile.storage_key
        );

      setMessage(
        "Rename database error: " +
          dbError.message
      );

      setRenaming(false);

      return;
    }

    setFiles(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            renamingFile.id
              ? {
                  ...item,
                  name: newName,
                  storage_key:
                    newPath,
                }
              : item
        )
    );

    setSharedFiles(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            renamingFile.id
              ? {
                  ...item,
                  name: newName,
                  storage_key:
                    newPath,
                }
              : item
        )
    );

    setRenaming(false);

    setMessage(
      `"${renamingFile.name}" renamed successfully! ✅`
    );

    closeRenameDialog();
  }

  // ==========================================
  // MOVE
  // ==========================================

  function openMoveDialog(
    file: CloudFile
  ) {
    setMovingFile(file);
    setMoveTargetId("");
    setMessage("");
  }

  function closeMoveDialog() {
    if (moving) return;

    setMovingFile(null);
    setMoveTargetId("");
  }

  async function moveFile() {
    if (!movingFile) return;

    if (!moveTargetId) {
      setMessage(
        "Please select a destination folder."
      );

      return;
    }

    const user =
      await getCurrentUser();

    if (!user) return;

    const target =
      allFolders.find(
        (folder) =>
          folder.id ===
          moveTargetId
      );

    if (!target) {
      setMessage(
        "Destination folder not found."
      );

      return;
    }

    setMoving(true);

    const safeName =
      movingFile.name.replace(
        /[^\w.\-() ]/g,
        "_"
      );

    const newPath =
      `${user.id}/${moveTargetId}/${movingFile.id}-${safeName}`;

    const {
      error: storageError,
    } =
      await supabase.storage
        .from("drive")
        .move(
          movingFile.storage_key,
          newPath
        );

    if (storageError) {
      setMessage(
        "Move storage error: " +
          storageError.message
      );

      setMoving(false);

      return;
    }

    const {
      error: dbError,
    } =
      await supabase
        .from("files")
        .update({
          folder_id:
            moveTargetId,
          storage_key:
            newPath,
        })
        .eq(
          "id",
          movingFile.id
        )
        .eq(
          "owner_id",
          user.id
        );

    if (dbError) {
      await supabase.storage
        .from("drive")
        .move(
          newPath,
          movingFile.storage_key
        );

      setMessage(
        "Move database error: " +
          dbError.message
      );

      setMoving(false);

      return;
    }

    setFiles(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            movingFile.id
        )
    );

    setMovingFile(null);
    setMoveTargetId("");
    setMoving(false);

    setMessage(
      `"${movingFile.name}" moved to "${target.name}" successfully! ✅`
    );
  }

  // ==========================================
  // MOVE TO TRASH
  // ==========================================

  async function moveFileToTrash(
    file: CloudFile
  ) {
    const user =
      await getCurrentUser();

    if (!user) return;

    const {
      error,
    } =
      await supabase
        .from("files")
        .update({
          is_deleted:
            true,
        })
        .eq(
          "id",
          file.id
        )
        .eq(
          "owner_id",
          user.id
        );

    if (error) {
      setMessage(
        "Trash error: " +
          error.message
      );

      return;
    }

    setFiles(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            file.id
        )
    );

    setMessage(
      `"${file.name}" moved to Trash. 🗑️`
    );
  }

  // ==========================================
  // RESTORE
  // ==========================================

  async function restoreFile(
    file: CloudFile
  ) {
    const user =
      await getCurrentUser();

    if (!user) return;

    const {
      error,
    } =
      await supabase
        .from("files")
        .update({
          is_deleted:
            false,
        })
        .eq(
          "id",
          file.id
        )
        .eq(
          "owner_id",
          user.id
        );

    if (error) {
      setMessage(
        "Restore error: " +
          error.message
      );

      return;
    }

    setFiles(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            file.id
        )
    );

    setMessage(
      `"${file.name}" restored successfully! ♻️`
    );
  }

  // ==========================================
  // DELETE FOREVER
  // ==========================================

  async function deleteForever(
    file: CloudFile
  ) {
    const user =
      await getCurrentUser();

    if (!user) return;

    const {
      error: storageError,
    } =
      await supabase.storage
        .from("drive")
        .remove([
          file.storage_key,
        ]);

    if (storageError) {
      setMessage(
        "Storage delete error: " +
          storageError.message
      );

      return;
    }

    const {
      error: dbError,
    } =
      await supabase
        .from("files")
        .delete()
        .eq(
          "id",
          file.id
        )
        .eq(
          "owner_id",
          user.id
        );

    if (dbError) {
      setMessage(
        "Database delete error: " +
          dbError.message
      );

      return;
    }

    setFiles(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            file.id
        )
    );

    setStarredIds(
      (current) =>
        current.filter(
          (id) =>
            id !== file.id
        )
    );

    setMessage(
      `"${file.name}" permanently deleted.`
    );
  }

  // ==========================================
  // LOAD SHARES
  // ==========================================

  async function loadFileShares(
    file: CloudFile
  ) {
    const user =
      await getCurrentUser();

    if (!user) return;

    setLoadingShares(true);

    const {
      data,
      error,
    } =
      await supabase
        .from("shares")
        .select(
          "id, resource_type, resource_id, grantee_user_id, role, created_by, created_at"
        )
        .eq(
          "resource_type",
          "file"
        )
        .eq(
          "resource_id",
          file.id
        )
        .eq(
          "created_by",
          user.id
        );

    if (error) {
      console.error(
        "Load shares error:",
        error
      );

      setMessage(
        "Share list error: " +
          error.message
      );

      setLoadingShares(false);

      return;
    }

    setFileShares(
      data ?? []
    );

    setLoadingShares(false);
  }

  // ==========================================
  // OPEN SHARE DIALOG
  // ==========================================

  async function openShareDialog(
    file: CloudFile
  ) {
    setSharingFile(file);
    setShareEmail("");
    setShareRole("viewer");
    setPublicLink(null);
    setPublicLinkExpiry("never");
    setPublicLinkPassword("");
    setMessage("");

    await Promise.all([
      loadFileShares(file),
      loadPublicLink(file),
    ]);
  }

  function closeShareDialog() {
    if (
      sharing ||
      creatingPublicLink ||
      revokingPublicLink
    ) {
      return;
    }

    setSharingFile(null);
    setShareEmail("");
    setFileShares([]);
    setPublicLink(null);
    setPublicLinkPassword("");
    setPublicLinkExpiry("never");
  }

  // ==========================================
  // LOAD PUBLIC LINK
  // ==========================================

  async function loadPublicLink(
    file: CloudFile
  ) {
    const user = await getCurrentUser();

    if (!user) return;

    setLoadingPublicLink(true);

    const {
      data,
      error,
    } = await supabase
      .from("link_shares")
      .select(
        "id, resource_type, resource_id, token, role, expires_at, created_by, created_at"
      )
      .eq(
        "resource_type",
        "file"
      )
      .eq(
        "resource_id",
        file.id
      )
      .eq(
        "created_by",
        user.id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Load public link error:",
        error
      );

      setPublicLink(null);
      setMessage(
        "Public link load error: " +
          error.message
      );

      setLoadingPublicLink(false);
      return;
    }

    setPublicLink(data ?? null);
    setLoadingPublicLink(false);
  }

  // ==========================================
  // CREATE PUBLIC LINK
  // ==========================================

  async function createPublicLink() {
    if (!sharingFile) return;

    const user = await getCurrentUser();

    if (!user) return;

    setCreatingPublicLink(true);
    setMessage("Creating public link...");

    let expiresAt: string | null = null;

    if (publicLinkExpiry !== "never") {
      const now = new Date();

      if (publicLinkExpiry === "1h") {
        now.setHours(now.getHours() + 1);
      }

      if (publicLinkExpiry === "1d") {
        now.setDate(now.getDate() + 1);
      }

      if (publicLinkExpiry === "7d") {
        now.setDate(now.getDate() + 7);
      }

      expiresAt = now.toISOString();
    }

    const {
      data,
      error,
    } = await supabase.rpc(
      "create_public_link",
      {
        p_resource_type: "file",
        p_resource_id:
          sharingFile.id,
        p_expires_at:
          expiresAt,
        p_password:
          publicLinkPassword.trim()
            ? publicLinkPassword.trim()
            : null,
      }
    );

    if (error) {
      console.error(
        "Create public link error:",
        error
      );

      setMessage(
        "Public link error: " +
          error.message
      );

      setCreatingPublicLink(false);
      return;
    }

    const createdLink =
      Array.isArray(data)
        ? data[0]
        : data;

    if (!createdLink) {
      setMessage(
        "Public link could not be created."
      );

      setCreatingPublicLink(false);
      return;
    }

    setPublicLink(createdLink);

    const url =
      `${window.location.origin}/share/${createdLink.token}`;

    try {
      await navigator.clipboard.writeText(
        url
      );

      setMessage(
        "Public link created and copied. ✅"
      );
    } catch {
      setMessage(
        "Public link created. Copy the link below."
      );
    }

    setPublicLinkPassword("");
    setCreatingPublicLink(false);
  }

  // ==========================================

  async function copyPublicLink() {
    if (!publicLink) return;

    const url =
      `${window.location.origin}/share/${publicLink.token}`;

    setCopyingPublicLink(true);

    try {
      await navigator.clipboard.writeText(
        url
      );

      setMessage(
        "Public link copied. ✅"
      );
    } catch (error) {
      console.error(
        "Copy public link error:",
        error
      );

      setMessage(
        "Could not copy the link. Please copy it manually."
      );
    }

    setCopyingPublicLink(false);
  }

  // ==========================================
  // REVOKE PUBLIC LINK
  // ==========================================

  async function revokePublicLink() {
    if (!publicLink) return;

    const user = await getCurrentUser();

    if (!user) return;

    setRevokingPublicLink(true);

    const {
      error,
    } = await supabase
      .from("link_shares")
      .delete()
      .eq(
        "id",
        publicLink.id
      )
      .eq(
        "created_by",
        user.id
      );

    if (error) {
      console.error(
        "Revoke public link error:",
        error
      );

      setMessage(
        "Revoke public link error: " +
          error.message
      );

      setRevokingPublicLink(false);
      return;
    }

    setPublicLink(null);
    setPublicLinkPassword("");

    setMessage(
      "Public link revoked successfully. ✅"
    );

    setRevokingPublicLink(false);
  }

  // ==========================================
  // SHARE FILE
  // ==========================================

  async function shareFile() {
    if (!sharingFile) return;

    const email =
      shareEmail
        .trim()
        .toLowerCase();

    if (!email) {
      setMessage(
        "Please enter an email address."
      );

      return;
    }

    const user =
      await getCurrentUser();

    if (!user) return;

    if (
      email ===
      user.email?.toLowerCase()
    ) {
      setMessage(
        "You cannot share a file with yourself."
      );

      return;
    }

    setSharing(true);

    setMessage(
      "Finding user..."
    );

    const {
      data: recipients,
      error: lookupError,
    } =
      await supabase.rpc(
        "find_user_by_email",
        {
          lookup_email:
            email,
        }
      );

    if (lookupError) {
      console.error(
        "User lookup error:",
        lookupError
      );

      setMessage(
        "User lookup error: " +
          lookupError.message
      );

      setSharing(false);

      return;
    }

    const recipient =
      recipients?.[0];

    if (!recipient) {
      setMessage(
        "No registered user found with this email."
      );

      setSharing(false);

      return;
    }

    const {
      data: existing,
      error: existingError,
    } =
      await supabase
        .from("shares")
        .select("id")
        .eq(
          "resource_type",
          "file"
        )
        .eq(
          "resource_id",
          sharingFile.id
        )
        .eq(
          "grantee_user_id",
          recipient.id
        )
        .maybeSingle();

    if (existingError) {
      setMessage(
        "Share check error: " +
          existingError.message
      );

      setSharing(false);

      return;
    }

    if (existing) {
      const {
        error,
      } =
        await supabase
          .from("shares")
          .update({
            role:
              shareRole,
          })
          .eq(
            "id",
            existing.id
          )
          .eq(
            "created_by",
            user.id
          );

      if (error) {
        setMessage(
          "Permission update error: " +
            error.message
        );

        setSharing(false);

        return;
      }

      setMessage(
        `Permission updated for ${email}. ✅`
      );
    } else {
      const {
        error,
      } =
        await supabase
          .from("shares")
          .insert({
            resource_type:
              "file",
            resource_id:
              sharingFile.id,
            grantee_user_id:
              recipient.id,
            role:
              shareRole,
            created_by:
              user.id,
          });

      if (error) {
        console.error(
          "Create share error:",
          error
        );

        setMessage(
          "Share error: " +
            error.message
        );

        setSharing(false);

        return;
      }

      setMessage(
        `"${sharingFile.name}" shared with ${email}. ✅`
      );
    }

    setShareEmail("");

    await loadFileShares(
      sharingFile
    );

    setSharing(false);
  }

  // ==========================================
  // REVOKE SHARE
  // ==========================================

  async function revokeShare(
    share: Share
  ) {
    const user =
      await getCurrentUser();

    if (!user) return;

    const {
      error,
    } =
      await supabase
        .from("shares")
        .delete()
        .eq(
          "id",
          share.id
        )
        .eq(
          "created_by",
          user.id
        );

    if (error) {
      setMessage(
        "Revoke error: " +
          error.message
      );

      return;
    }

    setFileShares(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            share.id
        )
    );

    setMessage(
      "Access revoked successfully. ✅"
    );
  }

  // ==========================================
  // FORMAT FILE SIZE
  // ==========================================

  function formatFileSize(
    bytes: number | null
  ) {
    if (bytes === null) {
      return "Unknown size";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (
      bytes <
      1024 * 1024
    ) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    if (
      bytes <
      1024 *
        1024 *
        1024
    ) {
      return `${(
        bytes /
        (1024 * 1024)
      ).toFixed(1)} MB`;
    }

    return `${(
      bytes /
      (1024 *
        1024 *
        1024)
    ).toFixed(1)} GB`;
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async function logout() {
    await supabase.auth.signOut();

    window.location.href =
      "/login";
  }

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    async function start() {
      await loadDrive(null);
      await loadAllFolders();
      await loadStars();

      setLoading(false);
    }

    start();
  }, []);

  // ==========================================
  // DISPLAY FILES
  // ==========================================

  let displayFiles =
    viewMode ===
    "shared"
      ? sharedFiles
      : files;

  const search =
    searchQuery
      .trim()
      .toLowerCase();

  if (search) {
    displayFiles =
      displayFiles.filter(
        (file) =>
          file.name
            .toLowerCase()
            .includes(search)
      );
  }

  const filteredFolders =
    folders.filter(
      (folder) =>
        folder.name
          .toLowerCase()
          .includes(search)
    );
    function renderFolderTree(parentId: string | null, level = 0) {
  const childFolders = allFolders.filter(
    (folder) => folder.parent_id === parentId
  );

  if (childFolders.length === 0) return null;

  return (
    <div className="space-y-1">
      {childFolders.map((folder) => {
        const hasChildren = allFolders.some(
          (item) => item.parent_id === folder.id
        );

        return (
          <div key={folder.id}>
            <button
              type="button"
              onClick={() => openFolder(folder)}
              style={{ paddingLeft: `${12 + level * 18}px` }}
              className="flex w-full items-center gap-2 rounded-lg py-2 pr-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              <span className="w-3 text-xs text-slate-400">
                {hasChildren ? "▸" : ""}
              </span>

              <span>📁</span>

              <span className="min-w-0 flex-1 truncate">
                {folder.name}
              </span>
            </button>

            {renderFolderTree(folder.id, level + 1)}
          </div>
        );
      })}
    </div>
  );
}


  const isSearching =
    search.length > 0;

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-6">
      <style jsx>{`
        @keyframes cloudPulse {
          0%,
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 18px rgba(0, 217, 255, 0.55));
          }

          50% {
            transform: scale(1.04);
            filter: drop-shadow(0 0 34px rgba(0, 217, 255, 0.9));
          }
        }

        @keyframes floatFile {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }

          50% {
            transform: translateY(-14px) rotate(3deg);
          }
        }

        @keyframes orbit {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes progress {
          0% {
            width: 15%;
          }

          50% {
            width: 72%;
          }

          100% {
            width: 92%;
          }
        }

        @keyframes glow {
          0%,
          100% {
            opacity: 0.35;
          }

          50% {
            opacity: 0.8;
          }
        }

        @keyframes wave {
          0% {
            transform: translateX(-10%);
          }

          50% {
            transform: translateX(5%);
          }

          100% {
            transform: translateX(-10%);
          }
        }

        .cloud-pulse {
          animation: cloudPulse 2.4s ease-in-out infinite;
        }

        .float-file {
          animation: floatFile 2.8s ease-in-out infinite;
        }

        .orbit {
          animation: orbit 8s linear infinite;
        }

        .loading-progress {
          animation: progress 3s ease-in-out infinite;
        }

        .glow {
          animation: glow 2s ease-in-out infinite;
        }

        .wave {
          animation: wave 8s ease-in-out infinite;
        }
      `}</style>

      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[10%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[10%] top-[20%] h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      {/* Main loading content */}
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">

        {/* Cloud */}
        <div className="relative mb-8 h-56 w-72 sm:h-64 sm:w-80">

          {/* Orbit ring */}
          <div className="orbit absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20 sm:h-72 sm:w-72" />

          {/* Glow */}
          <div className="glow absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/20 blur-3xl" />

          {/* Floating files */}
          <div className="float-file absolute left-2 top-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-400/10 text-2xl shadow-[0_0_25px_rgba(0,217,255,0.25)] backdrop-blur-xl">
            🖼️
          </div>

          <div
            className="float-file absolute right-2 top-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-300/40 bg-purple-400/10 text-2xl shadow-[0_0_25px_rgba(139,92,246,0.25)] backdrop-blur-xl"
            style={{ animationDelay: "0.5s" }}
          >
            📄
          </div>

          <div
            className="float-file absolute bottom-2 left-12 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-300/40 bg-blue-400/10 text-2xl shadow-[0_0_25px_rgba(59,130,246,0.25)] backdrop-blur-xl"
            style={{ animationDelay: "1s" }}
          >
            📁
          </div>

          <div
            className="float-file absolute bottom-5 right-12 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-400/10 text-2xl shadow-[0_0_25px_rgba(0,217,255,0.25)] backdrop-blur-xl"
            style={{ animationDelay: "1.5s" }}
          >
            📊
          </div>

          {/* Cloud */}
          <div className="cloud-pulse absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative flex h-36 w-52 items-center justify-center">

              {/* Cloud shape */}
              <div className="absolute bottom-2 h-20 w-44 rounded-full border border-cyan-200/70 bg-gradient-to-br from-cyan-400/30 via-blue-500/25 to-indigo-600/30 shadow-[0_0_45px_rgba(0,217,255,0.55)] backdrop-blur-xl" />

              <div className="absolute left-10 top-9 h-20 w-20 rounded-full border border-cyan-200/60 bg-blue-500/25 shadow-[0_0_30px_rgba(0,217,255,0.45)]" />

              <div className="absolute left-20 top-2 h-28 w-28 rounded-full border border-cyan-200/70 bg-cyan-400/20 shadow-[0_0_40px_rgba(0,217,255,0.5)]" />

              <div className="absolute right-7 top-8 h-20 w-20 rounded-full border border-cyan-200/60 bg-blue-500/25 shadow-[0_0_30px_rgba(0,217,255,0.45)]" />

              {/* Upload arrow */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]">
                  ↑
                </div>

                <div className="mt-1 h-1.5 w-16 rounded-full bg-cyan-300 shadow-[0_0_15px_rgba(0,217,255,0.9)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Brand */}
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Cloud{" "}
          <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(0,217,255,0.6)]">
            Storage
          </span>
        </h1>

        <p className="mt-3 text-sm tracking-[0.3em] text-slate-400 sm:text-base">
          STORE • ACCESS • SHARE • ANYWHERE
        </p>

        {/* Progress */}
        <div className="mt-10 w-full max-w-md">
          <div className="h-3 overflow-hidden rounded-full border border-cyan-400/20 bg-slate-800/80 shadow-inner">
            <div className="loading-progress h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_18px_rgba(0,217,255,0.8)]" />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Loading your workspace...
          </p>
        </div>

        {/* Bottom features */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-xs text-slate-400 sm:gap-16">
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span>Secure</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span>Fast</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">☁️</span>
            <span>Always with you</span>
          </div>
        </div>
      </div>

      {/* Bottom waves */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 overflow-hidden opacity-40">
        <div className="wave absolute -bottom-20 left-[-10%] h-40 w-[120%] rounded-[50%] border-t border-cyan-400/40 bg-blue-900/20" />

        <div
          className="wave absolute -bottom-24 left-[-5%] h-40 w-[110%] rounded-[50%] border-t border-blue-400/30 bg-indigo-900/20"
          style={{ animationDelay: "1.5s" }}
        />
      </div>
    </main>
  );
}

  
    // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="flex min-h-screen">

    <button
      type="button"
      onClick={() => setMobileMenuOpen(true)}
      className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 text-slate-700 shadow-lg backdrop-blur lg:hidden"
      aria-label="Open menu"
    >
      ☰
    </button>

    
    

        {/* ==========================================
            SIDEBAR
        ========================================== */}
        <aside
  className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex-col border-r border-[#e4edf7] bg-white shadow-[4px_0_18px_rgba(30,100,180,0.04)] ${
    mobileMenuOpen ? "flex" : "hidden"
  } lg:static lg:flex`}
>
  <button
  type="button"
  onClick={() => setMobileMenuOpen(false)}
  className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 lg:hidden"
  aria-label="Close menu"
>
  ✕
</button>
          {/* Logo */}
          <div className="border-b border-slate-100 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-xl text-white">
                ☁
              </div>

              <div>
                <p className="text-lg font-black tracking-tight">
                  Cloud Storage
                </p>
                <p className="text-xs text-slate-400">
                  Your files, organized
                </p>
              </div>
            </div>
          </div>

          {/* New / Upload */}
          <div className="px-4 pt-5">
            <button
              onClick={() => setShowFolderInput(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#dce9f5] bg-white text-slate-700 shadow-[0_4px_14px_rgba(30,100,180,0.06)] transition-all duration-200 hover:border-[#c9dff2] hover:bg-[#f8fbff] hover:text-sky-700"
            >
              <span className="text-lg">＋</span>
              New
            </button>

            <button
              onClick={openFilePicker}
              disabled={uploading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
            >
              <span className="text-lg">↑</span>
              {uploading ? "Uploading..." : "Upload"}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelected}
            />
          </div>

          {/* Navigation */}
          <nav className="mt-6 px-3">

            <button
              onClick={() => {
  goToMyDrive();
  setMobileMenuOpen(false);
}}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                viewMode === "drive"
                  ? "bg-sky-50 text-sky-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-lg">📁</span>
              My Drive
            </button>

            <button
              onClick={() => {
  openShared();
  setMobileMenuOpen(false);
}}
              className={`mt-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                viewMode === "shared"
                  ? "bg-sky-50 text-sky-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">👥</span>
                Shared with me
              </span>

              {sharedFiles.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  {sharedFiles.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
  openStarred();
  setMobileMenuOpen(false);
}}
              className={`mt-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                viewMode === "starred"
                  ? "bg-sky-50 text-sky-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">⭐</span>
                Starred
              </span>

              {starredIds.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  {starredIds.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
  openRecent();
  setMobileMenuOpen(false);
}}
              className={`mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                viewMode === "recent"
                  ? "bg-sky-50 text-sky-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-lg">🕘</span>
              Recent
            </button>

            <button
              onClick={() => {
  openTrash();
  setMobileMenuOpen(false);
}}
              className={`mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                viewMode === "trash"
                  ? "bg-red-50 text-red-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-lg">🗑️</span>
              Trash
            </button>

          </nav>

          {/* Storage */}
          <div className="mt-auto border-t border-slate-100 p-4">

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Storage
                </span>

                <span className="text-xs font-bold text-slate-700">
                  10 GB
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-sky-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        3,
                        (files.reduce(
                          (sum, file) =>
                            sum + (file.size_bytes || 0),
                          0
                        ) /
                          (10 * 1024 * 1024 * 1024)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {formatFileSize(
                  files.reduce(
                    (sum, file) =>
                      sum + (file.size_bytes || 0),
                    0
                  )
                )}{" "}
                used
              </p>
            </div>

            {/* User */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                {(userEmail?.[0] || "U").toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {userEmail}
                </p>
                <p className="text-xs text-slate-400">
                  Personal account
                </p>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ↪
              </button>
            </div>

          </div>
        </aside>

        {/* ==========================================
            MAIN CONTENT
        ========================================== */}
        <main className="min-w-0 flex-1">

          {/* Top bar */}
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">

            <div className="flex items-center gap-3">

              {/* Mobile logo */}
              <div className="flex shrink-0 items-center gap-2 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-lg text-white">
                  ☁
                </div>
              </div>

              {/* Search */}
              <div className="relative min-w-0 flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                  🔍
                </span>

                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files and folders..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50"
                />
              </div>

              {/* Upload */}
              <button
                onClick={openFilePicker}
                disabled={uploading}
                className="hidden shrink-0 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50 sm:block"
              >
                {uploading ? "Uploading..." : "↑ Upload"}
              </button>

              {/* User */}
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700 sm:flex">
                {(userEmail?.[0] || "U").toUpperCase()}
              </div>

            </div>
          </header>

          {/* Content */}
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

            {/* Mobile actions */}
            <div className="mb-5 flex gap-2 lg:hidden">

              <button
                onClick={() => setShowFolderInput(true)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm"
              >
                ＋ New
              </button>

              <button
                onClick={openFilePicker}
                disabled={uploading}
                className="flex-1 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white"
              >
                ↑ Upload
              </button>

            </div>

            {/* Breadcrumb / title */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="min-w-0">

                <div className="flex items-center gap-2 text-sm text-slate-500">

                  {viewMode === "drive" && currentFolderId && (
                    <>
                      <button
                        onClick={goToMyDrive}
                        className="hover:text-sky-600"
                      >
                        My Drive
                      </button>

                      <span>›</span>
                    </>
                  )}

                  <span className="font-medium text-slate-900">
                    {viewMode === "trash"
                      ? "Trash"
                      : viewMode === "starred"
                      ? "Starred"
                      : viewMode === "shared"
                      ? "Shared with me"
                      : viewMode === "recent"
                      ? "Recent"
                      : currentFolderName}
                  </span>

                </div>

                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  {viewMode === "trash"
                    ? "Trash"
                    : viewMode === "starred"
                    ? "Starred"
                    : viewMode === "shared"
                    ? "Shared with me"
                    : viewMode === "recent"
                    ? "Recent"
                    : currentFolderName}
                </h1>

              </div>

              {/* Folder navigation */}
              {viewMode === "drive" && (
                <div className="flex items-center gap-2">

                  <button
                    onClick={goBack}
                    disabled={historyIndex === 0}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ←
                  </button>

                  <button
                    onClick={goForward}
                    disabled={
                      historyIndex >= folderHistory.length - 1
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    →
                  </button>

                  {currentFolderId && (
                    <button
                      onClick={goToMyDrive}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50"
                    >
                      My Drive
                    </button>
                  )}

                </div>
              )}

            </div>

            {/* Message */}
            {message && (
              <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800">
                {message}
              </div>
            )}

            {/* New folder */}
            {viewMode === "drive" && showFolderInput && (
              <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">

                <input
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      createFolder();
                    }
                  }}
                  autoFocus
                  placeholder="Enter folder name..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                />

                <button
                  onClick={createFolder}
                  className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700"
                >
                  Create folder
                </button>

                <button
                  onClick={() => {
                    setShowFolderInput(false);
                    setFolderName("");
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>

              </div>
            )}

            {/* ==========================================
                FOLDERS
            ========================================== */}
            {viewMode === "drive" && filteredFolders.length > 0 && (
              <section className="mt-8">

                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">
                    Folders
                  </h2>

                  <button
                    onClick={() => setShowFolderInput(true)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-sky-600 hover:bg-sky-50"
                  >
                    ＋ New folder
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">

                  {filteredFolders.map((folder) => (
                  
  <div
    key={folder.id}
    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:shadow-md"
  >
    {/* OPEN FOLDER */}
    <button
      type="button"
      onClick={() => openFolder(folder)}
      className="flex min-w-0 flex-1 items-center gap-3 text-left"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-2xl">
        📁
      </div>

      <div className="min-w-0">
        <p
          className="truncate text-sm font-bold"
          title={folder.name}
        >
          {folder.name}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          Folder
        </p>
      </div>
    </button>

    {/* ⋮ MENU */}
    <details className="relative shrink-0">
      <summary
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg text-xl font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        title="Folder options"
      >
        ⋮
      </summary>

      <div className="absolute right-0 top-10 z-50 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
        
        <button
          type="button"
          onClick={() => renameFolder(folder)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
        >
          ✏️
          <span>Rename</span>
        </button>

        <button
          type="button"
          onClick={() => deleteFolder(folder)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          🗑️
          <span>Delete</span>
        </button>

      </div>
    </details>
  </div>
))}
                   
      

                </div>
              </section>
            )}

            {/* ==========================================
                FILES
            ========================================== */}
            <section className="mt-8">

              <div className="mb-4 flex items-center justify-between">

                <div>
                  <h2 className="text-lg font-bold">
                    {isSearching
                      ? "Search results"
                      : viewMode === "trash"
                      ? "Deleted files"
                      : viewMode === "starred"
                      ? "Starred files"
                      : viewMode === "shared"
                      ? "Shared files"
                      : viewMode === "recent"
                      ? "Recent files"
                      : "Files"}
                  </h2>

                  {displayFiles.length > 0 && (
                    <p className="mt-1 text-xs text-slate-400">
                      {displayFiles.length}{" "}
                      {displayFiles.length === 1
                        ? "file"
                        : "files"}
                    </p>
                  )}
                </div>

              </div>

              {displayFiles.length > 0 ? (

                <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">

                  {/* Desktop header */}
                  <div className="hidden grid-cols-[minmax(0,1fr)_130px_130px_50px] items-center border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 md:grid">
                    <span>Name</span>
                    <span>Size</span>
                    <span>Modified</span>
                    <span></span>
                  </div>

                  <div className="divide-y divide-slate-100">

                    {displayFiles.map((file) => {

                      const ext =
                        file.name
                          .split(".")
                          .pop()
                          ?.toLowerCase() || "";

                      const image =
                        ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);

                      const video =
                        ["mp4", "mov", "avi", "mkv", "webm"].includes(ext);

                      const audio =
                        ["mp3", "wav", "m4a", "aac", "flac"].includes(ext);

                      const pdf = ext === "pdf";

                      return (
                        <div
                          key={file.id}
                          className="group flex flex-col gap-3 px-4 py-4 hover:bg-slate-50 sm:px-5 md:grid md:grid-cols-[minmax(0,1fr)_130px_130px_50px] md:items-center"
                        >

                          {/* File name */}
                          <div className="flex min-w-0 items-center gap-3">

                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                                image
                                  ? "bg-purple-50"
                                  : video
                                  ? "bg-indigo-50"
                                  : audio
                                  ? "bg-emerald-50"
                                  : pdf
                                  ? "bg-red-50"
                                  : "bg-slate-100"
                              }`}
                            >
                              {image
                                ? "📷"
                                : video
                                ? "🎬"
                                : audio
                                ? "🎵"
                                : pdf
                                ? "📕"
                                : "📄"}
                            </div>

                            <div className="min-w-0 flex-1">

                              <button
                                onClick={() => viewFile(file)}
                                className="block max-w-full truncate text-left text-sm font-bold text-slate-800 hover:text-sky-600"
                                title={file.name}
                              >
                                {file.name}
                              </button>

                              <p className="mt-0.5 text-xs text-slate-400 md:hidden">
                                {formatFileSize(file.size_bytes)}{" "}
                                ·{" "}
                                {new Date(
                                  file.created_at
                                ).toLocaleDateString()}
                              </p>

                            </div>

                            {starredIds.includes(file.id) && (
                              <span
                                className="shrink-0 text-sm text-amber-500"
                                title="Starred"
                              >
                                ★
                              </span>
                            )}

                          </div>

                          {/* Size */}
                          <span className="hidden text-sm text-slate-500 md:block">
                            {formatFileSize(file.size_bytes)}
                          </span>

                          {/* Date */}
                          <span className="hidden text-sm text-slate-500 md:block">
                            {new Date(
                              file.created_at
                            ).toLocaleDateString()}
                          </span>

                          {/* Menu */}
                          <details className="relative md:justify-self-end">

                            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg text-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                              ⋮
                            </summary>

                            <div className="absolute right-0 top-10 z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">

                              <button
                                onClick={() => viewFile(file)}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                              >
                                👁️
                                <span>Open / View</span>
                              </button>

                              <button
                                onClick={() => downloadFile(file)}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                              >
                                ⬇️
                                <span>Download</span>
                              </button>

                              {viewMode === "drive" && (
                                <>
                                  <button
                                    onClick={() =>
                                      openRenameDialog(file)
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                                  >
                                    ✏️
                                    <span>Rename</span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      openMoveDialog(file)
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                                  >
                                    📂
                                    <span>Move</span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      toggleStar(file)
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                                  >
                                    {starredIds.includes(file.id)
                                      ? "☆"
                                      : "⭐"}
                                    <span>
                                      {starredIds.includes(file.id)
                                        ? "Remove star"
                                        : "Add to starred"}
                                    </span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      openShareDialog(file)
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                                  >
                                    👥
                                    <span>Share</span>
                                  </button>

                                  <div className="my-1 border-t border-slate-100" />

                                  <button
                                    onClick={() =>
                                      moveFileToTrash(file)
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    🗑️
                                    <span>Move to trash</span>
                                  </button>
                                </>
                              )}

                              {viewMode === "trash" && (
                                <>
                                  <button
                                    onClick={() =>
                                      restoreFile(file)
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-emerald-600 hover:bg-emerald-50"
                                  >
                                    ♻️
                                    <span>Restore</span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      deleteForever(file)
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    ❌
                                    <span>Delete forever</span>
                                  </button>
                                </>
                              )}

                            </div>

                          </details>

                          {/* Mobile actions */}
                          <div className="flex flex-wrap gap-2 md:hidden">

                            <button
                              onClick={() => viewFile(file)}
                              className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700"
                            >
                              View
                            </button>

                            <button
                              onClick={() => downloadFile(file)}
                              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                            >
                              Download
                            </button>

                            {viewMode === "drive" && (
                              <>
                                <button
                                  onClick={() =>
                                    openShareDialog(file)
                                  }
                                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
                                >
                                  Share
                                </button>

                                <button
                                  onClick={() =>
                                    openRenameDialog(file)
                                  }
                                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
                                >
                                  Rename
                                </button>
                              </>
                            )}

                          </div>

                        </div>
                      );
                    })}

                  </div>

                </div>

              ) : (

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

                  <div className="text-5xl">
                    {isSearching
                      ? "🔍"
                      : viewMode === "trash"
                      ? "🗑️"
                      : viewMode === "starred"
                      ? "⭐"
                      : viewMode === "shared"
                      ? "👥"
                      : "📂"}
                  </div>

                  <h3 className="mt-4 text-lg font-black">
                    {isSearching
                      ? "No matching files"
                      : viewMode === "trash"
                      ? "Trash is empty"
                      : viewMode === "starred"
                      ? "No starred files"
                      : viewMode === "shared"
                      ? "Nothing shared with you"
                      : "No files yet"}
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    {isSearching
                      ? "Try searching with a different file or folder name."
                      : viewMode === "drive"
                      ? "Upload a file or create a folder to get started."
                      : "There is nothing to show here yet."}
                  </p>

                  {viewMode === "drive" && !isSearching && (
                    <button
                      onClick={openFilePicker}
                      className="mt-5 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700"
                    >
                      ↑ Upload your first file
                    </button>
                  )}

                </div>

              )}

            </section>

          </div>
        </main>
      

      {/* ======================================
          SHARE MODAL
      ====================================== */}

  
      {sharingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

            {/* MODAL HEADER */}
            <div className="flex items-start justify-between">

              <div>
                <h3 className="text-xl font-bold">
                  Share File
                </h3>

                <p className="mt-1 max-w-sm truncate text-sm text-gray-500">
                  {
                    sharingFile.name
                  }
                </p>
              </div>

              <button
                onClick={
                  closeShareDialog
                }
                disabled={
                  sharing
                }
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>

            </div>

            {/* EMAIL */}
            <label className="mt-6 block text-sm font-medium">
              Email address
            </label>

            <input
              type="email"
              value={
                shareEmail
              }
              onChange={(e) =>
                setShareEmail(
                  e.target.value
                )
              }
              placeholder="friend@example.com"
              className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
            />

            {/* ROLE */}
            <label className="mt-4 block text-sm font-medium">
              Permission
            </label>

            <select
              value={
                shareRole
              }
              onChange={(e) =>
                setShareRole(
                  e.target.value as
                    | "viewer"
                    | "editor"
                )
              }
              className="mt-2 w-full rounded-lg border bg-white px-4 py-3"
            >

              <option value="viewer">
                Viewer — Can view/download
              </option>

              <option value="editor">
                Editor — Can edit
              </option>

            </select>

            {/* SHARE BUTTON */}
            <button
              onClick={
                shareFile
              }
              disabled={
                sharing ||
                !shareEmail.trim()
              }
              className="mt-4 w-full rounded-lg bg-black px-4 py-3 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sharing
                ? "Sharing..."
                : "Share"}
            </button>

            {/* PEOPLE WITH ACCESS */}
            <div className="mt-8">

              <h4 className="font-semibold">
                People with access
              </h4>

              {loadingShares ? (
                <p className="mt-3 text-sm text-gray-500">
                  Loading...
                </p>
              ) : fileShares.length ===
                0 ? (
                <p className="mt-3 text-sm text-gray-500">
                  No one has access yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">

                  {fileShares.map(
                    (share) => (
                      <div
                        key={
                          share.id
                        }
                        className="flex items-center justify-between rounded-lg border p-3"
                      >

                        <div className="min-w-0">

                          <p className="text-sm font-medium">
                            Shared User
                          </p>

                          <p className="truncate text-xs text-gray-500">
                            {
                              share.grantee_user_id
                            }
                          </p>

                        </div>

                        <div className="ml-3 flex items-center gap-2">

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize">
                            {
                              share.role
                            }
                          </span>

                          <button
                            onClick={() =>
                              revokeShare(
                                share
                              )
                            }
                            className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            Revoke
                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            {/* PUBLIC LINK */}
            <div className="mt-8 border-t pt-6">

              <div>
                <h4 className="font-semibold">
                  Public link
                </h4>

                <p className="mt-1 text-sm text-gray-500">
                  Anyone with the link can view and download this file.
                </p>
              </div>

              {loadingPublicLink ? (
                <p className="mt-4 text-sm text-gray-500">
                  Loading public link...
                </p>
              ) : publicLink ? (
                <div className="mt-4 rounded-xl border bg-gray-50 p-4">

                  <p className="text-xs font-medium text-gray-500">
                    Share link
                  </p>

                  <div className="mt-2 flex gap-2">

                    <input
                      readOnly
                      value={`${window.location.origin}/share/${publicLink.token}`}
                      className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm"
                    />

                    <button
                      onClick={copyPublicLink}
                      disabled={copyingPublicLink}
                      className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {copyingPublicLink
                        ? "Copying..."
                        : "Copy"}
                    </button>

                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">

                    <p className="text-xs text-gray-500">
                      {publicLink.expires_at
                        ? `Expires: ${new Date(
                            publicLink.expires_at
                          ).toLocaleString()}`
                        : "Never expires"}
                    </p>

                    <button
                      onClick={revokePublicLink}
                      disabled={revokingPublicLink}
                      className="rounded-lg px-3 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {revokingPublicLink
                        ? "Revoking..."
                        : "Revoke link"}
                    </button>

                  </div>

                </div>
              ) : (
                <div className="mt-4 rounded-xl border p-4">

                  <label className="block text-sm font-medium">
                    Link expiry
                  </label>

                  <select
                    value={publicLinkExpiry}
                    onChange={(e) =>
                      setPublicLinkExpiry(
                        e.target.value as
                          | "never"
                          | "1h"
                          | "1d"
                          | "7d"
                      )
                    }
                    className="mt-2 w-full rounded-lg border bg-white px-4 py-3"
                  >
                    <option value="never">
                      Never
                    </option>

                    <option value="1h">
                      1 hour
                    </option>

                    <option value="1d">
                      1 day
                    </option>

                    <option value="7d">
                      7 days
                    </option>
                  </select>

                  <label className="mt-4 block text-sm font-medium">
                    Password <span className="font-normal text-gray-400">(optional)</span>
                  </label>

                  <input
                    type="password"
                    value={publicLinkPassword}
                    onChange={(e) =>
                      setPublicLinkPassword(
                        e.target.value
                      )
                    }
                    placeholder="Leave empty for no password"
                    className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                  />

                  <button
                    onClick={createPublicLink}
                    disabled={creatingPublicLink}
                    className="mt-4 w-full rounded-lg border bg-gray-900 px-4 py-3 text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingPublicLink
                      ? "Creating link..."
                      : "🔗 Create Public Link"}
                  </button>

                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ======================================
          RENAME MODAL
      ====================================== */}

      {renamingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6">

            <h3 className="text-xl font-bold">
              Rename File
            </h3>

            <input
              type="text"
              value={
                renameName
              }
              onChange={(e) =>
                setRenameName(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key ===
                  "Enter"
                ) {
                  renameFile();
                }

                if (
                  e.key ===
                  "Escape"
                ) {
                  closeRenameDialog();
                }
              }}
              autoFocus
              className="mt-5 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
            />

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={
                  closeRenameDialog
                }
                className="rounded-lg border px-4 py-2"
              >
                Cancel
              </button>

              <button
                onClick={
                  renameFile
                }
                disabled={
                  renaming
                }
                className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
              >
                {renaming
                  ? "Renaming..."
                  : "Rename"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ======================================
          MOVE MODAL
      ====================================== */}

      {movingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6">

            <h3 className="text-xl font-bold">
              Move File
            </h3>

            <p className="mt-2 truncate text-sm text-gray-500">
              {
                movingFile.name
              }
            </p>

            <select
              value={
                moveTargetId
              }
              onChange={(e) =>
                setMoveTargetId(
                  e.target.value
                )
              }
              className="mt-5 w-full rounded-lg border bg-white px-4 py-3"
            >

              <option value="">
                Select destination folder
              </option>

              {allFolders
                .filter(
                  (folder) =>
                    folder.id !==
                    movingFile.folder_id
                )
                .map(
                  (folder) => (
                    <option
                      key={
                        folder.id
                      }
                      value={
                        folder.id
                      }
                    >
                      📁{" "}
                      {
                        folder.name
                      }
                    </option>
                  )
                )}

            </select>

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={
                  closeMoveDialog
                }
                className="rounded-lg border px-4 py-2"
              >
                Cancel
              </button>

              <button
                onClick={
                  moveFile
                }
                disabled={
                  moving ||
                  !moveTargetId
                }
                className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
              >
                {moving
                  ? "Moving..."
                  : "Move"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}