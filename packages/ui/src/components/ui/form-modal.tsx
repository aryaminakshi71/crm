"use client";

import * as React from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Modal } from "./modal";
import { Select } from "./select";

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  // NEW API (keep existing)
  fields?: {
    name: string;
    label: string;
    type?: "text" | "email" | "password" | "select" | "textarea";
    options?: { value: string; label: string }[];
    required?: boolean;
    placeholder?: string;
  }[];
  initialData?: Record<string, any>;
  submitText?: string;
  // OLD API (ADD THIS - for backward compatibility)
  isLoading?: boolean;
  loading?: boolean; // alias for isLoading
  onSubmit?: (data: Record<string, any>) => void | Promise<void>;
  children?: React.ReactNode;
}

const FormModal = ({
  isOpen,
  onClose,
  title,
  // NEW API props
  fields,
  initialData = {},
  submitText = "Submit",
  // OLD API props
  isLoading = false,
  loading,
  onSubmit,
  children,
}: FormModalProps) => {
  // Support both isLoading and loading prop
  const loadingState = loading ?? isLoading;
  // OLD API: If children are provided, use children pattern
  if (children) {
    const handleChildrenSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (onSubmit) {
        // Pass empty object - onSubmit handlers should not expect event
        // They should work with the component's internal state
        onSubmit({} as any);
      }
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <form onSubmit={handleChildrenSubmit} className="space-y-4">
          {children}
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loadingState}>
              {loadingState ? "Loading..." : submitText}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  // NEW API: Original fields-based pattern
  const [formData, setFormData] =
    React.useState<Record<string, any>>(initialData);

  React.useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    onClose();
  };

  // If no children and no fields, render empty form
  if (!fields || fields.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loadingState}>
              {loadingState ? "Loading..." : submitText}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            {field.type === "select" ? (
              <Select
                label={field.label}
                name={field.name}
                value={formData[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                options={field.options || []}
                required={field.required}
              />
            ) : field.type === "textarea" ? (
              <div>
                <label className="mb-1 block font-medium text-foreground text-sm">
                  {field.label}
                  {field.required && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                </label>
                <textarea
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              </div>
            ) : (
              <Input
                label={field.label}
                type={field.type || "text"}
                name={field.name}
                value={formData[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
          </div>
        ))}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loadingState}>
            {loadingState ? "Loading..." : submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export { FormModal };
