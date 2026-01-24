"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { Loader, Trash } from "lucide-react";
import { useDropzone } from "@uploadthing/react";
import { generateClientDropzoneAccept } from "uploadthing/client";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { useUploadThing } from "@/lib/uploadthing";

interface ImageUploadProps {
  defaultUrl?: string | null;
  onChange?: (url: string | null) => void;
  endpoint: keyof OurFileRouter;
}

export default function ImageUpload({
  defaultUrl,
  onChange,
  endpoint,
}: ImageUploadProps) {
  const [value, setValue] = useState<string | null>(defaultUrl ?? null);
  const [showDropzone, setShowDropzone] = useState<boolean>(!defaultUrl);

  // Initializing the upload hook
  const { startUpload, isUploading, routeConfig } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.url;
      if (url) {
        setValue(url);
        onChange?.(url);
        setShowDropzone(false);
      }
    },
    onUploadError: (error: Error) => {
      alert(`Error uploading: ${error.message}`);
    },
  });

  // handle drop event to trigger upload immediately
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      startUpload(acceptedFiles);
    },
    [startUpload]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: routeConfig ? generateClientDropzoneAccept(Object.keys(routeConfig)) : undefined,
  });


  if (!showDropzone && value) {
    return (
      <div className="relative w-25 h-25">
        <div className="relative w-25 h-25 shadow-lg overflow-hidden rounded-full">
          <Image src={value} className="object-cover" fill alt="user image" />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setShowDropzone(true)}
            className="absolute -top-2 -right-2 bg-rose-100 p-1 rounded-full text-rose-600 hover:bg-rose-200 transition"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      {...getRootProps()} 
      className={`relative border-2 border-dashed rounded-xl p-8 transition flex flex-col items-center justify-center cursor-pointer
        ${isUploading ? "opacity-50 cursor-not-allowed" : "hover:border-blue-500 hover:bg-slate-50"}`}
    >
      <input {...getInputProps()} />
      
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-10 w-10 text-blue-700 animate-spin" />
          <p className="text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium">
            {value ? "Drop to replace" : "Drop profile image here"}
          </p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
        </div>
      )}
    </div>
  );
}
