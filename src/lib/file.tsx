import { Button, ButtonProps, styled } from "@mui/material";
import { PropsWithChildren, useState } from "react";

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });

export const downloadJSON = (data: object, filename: string = "data.json") => {
    // Convert JSON object to string
    const jsonStr = JSON.stringify(data, null, 2); // Pretty-print with 2 spaces
  
    // Create a Blob containing the JSON data
    const blob = new Blob([jsonStr], { type: "application/json" });
  
    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);
  
    // Create a link element and trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
  
    // Cleanup: Remove element and revoke the object URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

interface FileUploadedHandler<T>{
    onFileLoaded: (content: T) => void
}

export const FileImportButton = <T,>({
    onFileLoaded,
    children,
    ...rest
  }: FileUploadedHandler<T> & Pick<ButtonProps, "startIcon" | "variant"> & PropsWithChildren) => {


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
            const result = e.target?.result as string;
            const parsedJson = JSON.parse(result);
            onFileLoaded(parsedJson)
            } catch (error) {
            console.error("Error parsing JSON:", error);
            }
        };
        reader.readAsText(event.target.files[0]);
    }
  };


  return (
    <Button
        {...rest}
        component='label'
        role={undefined}
        tabIndex={-1}
    >
        {children}
        <VisuallyHiddenInput
            type="file"
            onChange={handleFileSelect}
            multiple
        />
    </Button>
  )
};

export default FileImportButton;

  