import { Badge, Button, Modal } from "@crm/ui";
import { ArrowRight, Table, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
  title: string;
  fields: { key: string; label: string; required?: boolean }[];
}

export function CsvImportModal({
  isOpen,
  onClose,
  onImport,
  title,
  fields,
}: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<
    "upload" | "mapping" | "preview" | "importing"
  >("upload");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (selectedFile: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length < 2) {
        toast.error("CSV file must have at least a header and one data row");
        return;
      }

      const csvHeaders = parseCSVLine(lines[0]);
      const rows = lines.slice(1).map(parseCSVLine);

      setHeaders(csvHeaders);
      setCsvData(rows);

      // Auto-mapping
      const initialMapping: Record<string, string> = {};
      fields.forEach((field) => {
        const match = csvHeaders.find(
          (h) =>
            h.toLowerCase().includes(field.label.toLowerCase()) ||
            h.toLowerCase().includes(field.key.toLowerCase()) ||
            field.key.toLowerCase().includes(h.toLowerCase()),
        );
        if (match) initialMapping[field.key] = match;
      });
      setMapping(initialMapping);
      setStep("mapping");
    };
    reader.readAsText(selectedFile);
  };

  const parseCSVLine = (line: string) => {
    const result = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
        inQuote = !inQuote;
      } else if (char === "," && !inQuote) {
        result.push(cur.trim().replace(/^"|"$/g, ""));
        cur = "";
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^"|"$/g, ""));
    return result;
  };

  const handleImport = async () => {
    setStep("importing");
    const dataToImport = csvData.map((row) => {
      const item: any = {};
      fields.forEach((field) => {
        const headerIndex = headers.indexOf(mapping[field.key]);
        if (headerIndex !== -1) {
          item[field.key] = row[headerIndex];
        }
      });
      return item;
    });

    // Validating required fields
    const validData = dataToImport.filter((item) => {
      return fields.every(
        (f) => !f.required || (item[f.key] && item[f.key].trim()),
      );
    });

    if (validData.length === 0) {
      toast.error("No valid data found after mapping. Check required fields.");
      setStep("mapping");
      return;
    }

    try {
      // Chunked import for progress feedback
      const chunkSize = 10;
      const total = validData.length;
      for (let i = 0; i < total; i += chunkSize) {
        const chunk = validData.slice(i, i + chunkSize);
        await Promise.all(chunk.map((item) => onImport(item as any)));
        setProgress(Math.round(((i + chunk.length) / total) * 100));
      }
      toast.success(`Successfully imported ${total} records`);
      handleClose();
    } catch (error) {
      toast.error("Import failed at some point.");
      setStep("preview");
    }
  };

  const handleClose = () => {
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setMapping({});
    setStep("upload");
    setProgress(0);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      className="max-w-4xl"
    >
      <div className="space-y-6 py-4">
        {step === "upload" && (
          <div
            className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-muted-foreground text-sm">
              CSV files only (max 10MB)
            </p>
            <div
              className="mt-4 p-2 rounded-lg bg-muted/50 text-[10px] text-muted-foreground flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                const csvContent =
                  fields.map((f) => f.label).join(",") +
                  "\n" +
                  fields.map(() => "Sample Data").join(",");
                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.setAttribute("hidden", "");
                a.setAttribute("href", url);
                a.setAttribute("download", "template.csv");
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            >
              <Table className="h-3 w-3" />
              <span>Download sample template.csv</span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Map CSV Columns</h3>
              <p className="text-sm text-muted-foreground">
                {csvData.length} rows detected
              </p>
            </div>
            <div className="grid gap-4">
              {fields.map((field) => (
                <div
                  key={field.key}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm flex items-center gap-2">
                      {field.label}
                      {field.required && (
                        <Badge
                          variant="danger"
                          className="text-[10px] px-1 h-4"
                        >
                          Required
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Target Field
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <select
                      className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                      value={mapping[field.key] || ""}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Do not import</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">CSV Column</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep("preview")}
                disabled={fields.some((f) => f.required && !mapping[f.key])}
              >
                Preview Data
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Preview & Import</h3>
              <p className="text-sm text-muted-foreground">
                Showing first 5 rows
              </p>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {fields.map((f) =>
                      mapping[f.key] ? (
                        <th
                          key={f.key}
                          className="px-4 py-2 text-left font-medium text-muted-foreground"
                        >
                          {f.label}
                        </th>
                      ) : null,
                    )}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {fields.map((f) => {
                        const hIndex = headers.indexOf(mapping[f.key]);
                        return mapping[f.key] ? (
                          <td
                            key={f.key}
                            className="px-4 py-2 truncate max-w-[150px]"
                          >
                            {row[hIndex] || "-"}
                          </td>
                        ) : null;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Modify Mapping
              </Button>
              <Button variant="primary" onClick={handleImport}>
                Import Records
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="h-2 w-full max-w-md bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-foreground font-medium">
              Importing records... {progress}%
            </p>
            <p className="text-sm text-muted-foreground">
              Please do not close this modal
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
