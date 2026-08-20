import Link from "next/link";
import { FileText, FileSpreadsheet, File } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAccounts } from "@/lib/queries";
import PageHeader from "@/components/ui/PageHeader";
import UploadForm from "./UploadForm";
import type { ImportFileType } from "@/lib/database.types";

const FILE_ICON: Record<ImportFileType, React.ElementType> = {
  csv: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  pdf: FileText,
};

export default async function ImportarPage() {
  const supabase = await createClient();
  const accounts = await getAccounts(supabase);

  const { data: batches, error } = await supabase
    .from("import_batches")
    .select("*")
    .order("imported_at", { ascending: false })
    .limit(20);
  if (error) throw error;

  return (
    <div>
      <PageHeader
        title="Importar extrato"
        description="Envie um arquivo CSV, XLSX ou PDF do seu banco para importar as transações."
      />

      <div className="card mb-6 p-6">
        <UploadForm accounts={accounts} />
      </div>

      {batches && batches.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted">
            Importações recentes
          </h2>
          <div className="card divide-y divide-border overflow-hidden">
            {batches.map((batch) => {
              const Icon = FILE_ICON[batch.file_type] ?? File;
              return (
                <Link
                  key={batch.id}
                  href={`/importar/${batch.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/[.02]"
                >
                  <Icon size={16} className="text-muted" />
                  <span className="flex-1 truncate">{batch.source_filename}</span>
                  <span className="text-xs text-muted">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(batch.imported_at))}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      batch.status === "concluido"
                        ? "bg-positive/10 text-positive"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {batch.status === "concluido" ? "Concluído" : "Em revisão"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
