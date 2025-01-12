'use client'

import React, { useState, KeyboardEvent, useMemo } from 'react'
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X } from 'lucide-react'

interface TagInputProps {
  value?: string[] | string
  onChange?: (value: string[]) => void
}

export default function TagInput({ value = [], onChange }: TagInputProps) {
  // Memoize the initial tags array
  const initialTags = useMemo(() => {
    return Array.isArray(value) ? value : [];
  }, [value]);

  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState('');

  // Update tags when value prop changes
  React.useEffect(() => {
    const newTags = Array.isArray(value) ? value : [];
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(newTags);
    
    if (tagsChanged) {
      setTags(newTags);
    }
  }, [value]); // Remove tags from dependency array to prevent loops

  // Memoize the handler functions to prevent unnecessary re-renders
  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputKeyDown = React.useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' && inputValue.trim()) {
      e.preventDefault();
      const newTags = [...tags, inputValue.trim()];
      setTags(newTags);
      setInputValue('');
      onChange?.(newTags);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      e.preventDefault();
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      onChange?.(newTags);
    }
  }, [inputValue, tags, onChange]);

  const removeTag = React.useCallback((indexToRemove: number) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove);
    setTags(newTags);
    onChange?.(newTags);
  }, [tags, onChange]);

  // Memoize the badges rendering
  const tagBadges = useMemo(() => {
    return tags.map((tag, index) => (
      <Badge key={index} variant="secondary" className="text-sm py-1 px-2">
        {tag}
        <X
          className="w-4 h-4 ml-1 cursor-pointer"
          onClick={() => removeTag(index)}
        />
      </Badge>
    ));
  }, [tags, removeTag]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2">
        {tagBadges}
      </div>
      <Input
        type="text"
        placeholder="Type a tag and press space..."
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        className="w-full"
      />
    </div>
  );
}