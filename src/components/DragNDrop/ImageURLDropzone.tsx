import React, { useEffect, useState } from 'react';
import { Card, CardBody } from 'reactstrap';

export interface IImageUrlDropzone {
  onUrlDrop(url?: string): void;
}

export const ImageUrlDropzone = (props: IImageUrlDropzone): JSX.Element => {
  const { onUrlDrop } = props;
  const [, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedText = e.dataTransfer.getData('text');
    if (isValidImageUrl(droppedText)) {
      setPreviewUrl(droppedText);
    } else {
      alert('Please drop a valid image URL.');
    }
  };

  const isValidImageUrl = (url: string): boolean => {
    return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  };

  const removeImage = () => {
    setPreviewUrl(undefined);
  }

  useEffect(() => {
    props.onUrlDrop(previewUrl);
  }, [previewUrl]);

  return (
    <Card
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`text-center border border-dashed w-100`}
      style={{ cursor: 'pointer', minHeight: 200 }}
    >
      <CardBody>
        <p style={{ fontSize: '0.9em'}}>controlnet</p>
        {previewUrl ? (
          <img onClick={removeImage} src={previewUrl} alt="Dropped preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
        ) : (
          <p></p>
        )}
      </CardBody>
    </Card>
  );
};
