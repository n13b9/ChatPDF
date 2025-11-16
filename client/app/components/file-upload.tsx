"use client";

import * as React from "react";
import { Upload } from "lucide-react";

const FileUploadComponent: React.FC = () => {
  const handleFileUpload = () => {
    const el = document.createElement("input");
    el.type = "file";
    el.accept = "application/pdf";

    el.onchange = async () => {
      const file = el.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("pdf", file);

      await fetch("http://localhost:8000/upload/pdf", {
        method: "POST",
        body: formData,
      });

      console.log("Uploaded");
    };

    el.click();
  };

  return (
    <div
      onClick={handleFileUpload}
      className="
        cursor-pointer w-full max-w-sm mx-auto
        bg-white border border-gray-200 rounded-2xl
        shadow-sm hover:shadow-md transition
        p-8 text-center
      "
    >
      <Upload className="w-10 h-10 text-gray-500 mx-auto mb-4" />

      <h3 className="text-lg font-semibold text-gray-800">
        Upload PDF File
      </h3>

      <p className="text-sm text-gray-500 mt-1">
        Click to choose a file
      </p>
    </div>
  );
};

export default FileUploadComponent;
