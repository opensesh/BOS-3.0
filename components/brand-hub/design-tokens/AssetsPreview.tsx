'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileType, Check } from 'lucide-react';

interface FontFile {
  family: string;
  weight: number;
  style: string;
  file: string;
}

interface AssetsPreviewProps {
  fontFiles: Record<string, FontFile>;
}

// Get weight name from number
function getWeightName(weight: number): string {
  const names: Record<number, string> = {
    100: 'Thin',
    200: 'Extra Light',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'Semi Bold',
    700: 'Bold',
    800: 'Extra Bold',
    900: 'Black',
  };
  return names[weight] || `Weight ${weight}`;
}

// Font file row component
function FontFileRow({
  name,
  file,
  index
}: {
  name: string;
  file: FontFile;
  index: number;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/styles/${file.file}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.file.split('/').pop() || 'font.woff2';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 3000);
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const fileName = file.file.split('/').pop() || '';
  const weightName = getWeightName(file.weight);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-[var(--bg-tertiary)]/50 transition-colors group"
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)] flex items-center justify-center shrink-0">
        <FileType className="w-5 h-5 text-[var(--fg-tertiary)]" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--fg-primary)] truncate">
            {fileName}
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--fg-tertiary)] bg-[var(--bg-tertiary)]/50 rounded uppercase">
            woff2
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[var(--fg-tertiary)]">
            {file.family}
          </span>
          <span className="text-xs text-[var(--fg-quaternary)]">·</span>
          <span className="text-xs text-[var(--fg-tertiary)]">
            {weightName}
          </span>
        </div>
      </div>

      {/* Download button */}
      <motion.button
        onClick={handleDownload}
        disabled={downloading}
        className="p-2 rounded-lg text-[var(--fg-tertiary)] hover:text-[var(--fg-brand-primary)] hover:bg-[var(--bg-tertiary)] transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Download ${fileName}`}
      >
        {downloaded ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : downloading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Download className="w-4 h-4" />
          </motion.div>
        ) : (
          <Download className="w-4 h-4" />
        )}
      </motion.button>
    </motion.div>
  );
}

/**
 * AssetsPreview
 *
 * Displays font files with metadata and individual download buttons.
 */
export function AssetsPreview({ fontFiles }: AssetsPreviewProps) {
  const files = Object.entries(fontFiles);

  // Group files by family
  const groupedFiles = files.reduce((acc, [name, file]) => {
    const family = file.family;
    if (!acc[family]) {
      acc[family] = [];
    }
    acc[family].push({ name, file });
    return acc;
  }, {} as Record<string, Array<{ name: string; file: FontFile }>>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedFiles).map(([family, familyFiles], groupIndex) => (
        <motion.div
          key={family}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
        >
          {/* Family header */}
          <h4 className="text-sm font-medium text-[var(--fg-secondary)] mb-2 px-1">
            {family}
          </h4>

          {/* Files list */}
          <div className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/30 divide-y divide-[var(--border-primary)]/20">
            {familyFiles.map(({ name, file }, index) => (
              <FontFileRow
                key={name}
                name={name}
                file={file}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      ))}

      {/* Summary */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-[var(--fg-tertiary)]">
          {files.length} font files · WOFF2 format for optimal web performance
        </p>
      </div>
    </div>
  );
}
