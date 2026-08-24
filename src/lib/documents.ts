export const KNOWLEDGE_BUCKET = "knowledge-documents";
export const MAX_DOCUMENT_SIZE_MB = 4;
export const MAX_DOCUMENT_SIZE_BYTES =
  MAX_DOCUMENT_SIZE_MB * 1024 * 1024;

export const DOCUMENT_ACCEPT_ATTRIBUTE =
  ".pdf,.txt,.md,application/pdf,text/plain,text/markdown";

const ALLOWED_DOCUMENT_TYPES = {
  pdf: {
    canonicalMimeType: "application/pdf",
    acceptedMimeTypes: ["application/pdf"],
  },
  txt: {
    canonicalMimeType: "text/plain",
    acceptedMimeTypes: ["text/plain"],
  },
  md: {
    canonicalMimeType: "text/markdown",
    acceptedMimeTypes: [
      "text/markdown",
      "text/plain",
      "text/x-markdown",
      "application/x-markdown",
    ],
  },
} as const;

type FileMetadata = {
  name: string;
  size: number;
  type: string;
};

type ValidDocument = {
  valid: true;
  extension: keyof typeof ALLOWED_DOCUMENT_TYPES;
  canonicalMimeType: string;
};

type InvalidDocument = {
  valid: false;
  message: string;
};

export function validateDocumentFile(
  file: FileMetadata,
): ValidDocument | InvalidDocument {
  if (!file.name || file.size <= 0) {
    return { valid: false, message: "Choose a non-empty document to upload." };
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      valid: false,
      message: `Documents must be ${MAX_DOCUMENT_SIZE_MB} MB or smaller.`,
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !(extension in ALLOWED_DOCUMENT_TYPES)) {
    return {
      valid: false,
      message: "Choose a PDF, TXT, or Markdown document.",
    };
  }

  const typedExtension = extension as keyof typeof ALLOWED_DOCUMENT_TYPES;
  const typeConfig = ALLOWED_DOCUMENT_TYPES[typedExtension];

  if (!(typeConfig.acceptedMimeTypes as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      message: `The selected .${typedExtension} file has an unsupported file type.`,
    };
  }

  return {
    valid: true,
    extension: typedExtension,
    canonicalMimeType: typeConfig.canonicalMimeType,
  };
}

export function sanitizeStorageFileName(fileName: string, extension: string) {
  const baseName = fileName.slice(0, -(extension.length + 1));
  const safeBaseName = baseName
    .normalize("NFKD")
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 100);

  return `${safeBaseName || "document"}.${extension}`;
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
