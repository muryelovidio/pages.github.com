// Tipos do banco escritos à mão a partir de supabase/migrations/0001_init.sql.
// Se o schema mudar, atualize este arquivo (ou gere com `supabase gen types typescript`).

export type AccountType = "banco" | "dinheiro" | "investimento";
export type TransactionType = "entrada" | "saida";
export type TransactionStatus = "confirmado" | "pendente";
export type MatchType = "contains" | "exact" | "regex";
export type ImportFileType = "pdf" | "csv" | "xlsx";
export type ImportBatchStatus = "em_revisao" | "concluido";
export type InvoiceStatus = "aberta" | "fechada" | "paga";
export type Recurrence = "mensal" | "unico";
export type ChatRole = "user" | "assistant";

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: AccountType;
          initial_balance: number;
          current_balance: number;
          color: string | null;
          icon: string | null;
          is_active: boolean;
          is_demo: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["accounts"]["Row"]> & {
          user_id: string;
          name: string;
          type: AccountType;
        };
        Update: Partial<Database["public"]["Tables"]["accounts"]["Row"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          color: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      categorization_rules: {
        Row: {
          id: string;
          user_id: string;
          match_pattern: string;
          category_id: string;
          match_type: MatchType;
          confidence: number;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["categorization_rules"]["Row"]
        > & {
          user_id: string;
          match_pattern: string;
          category_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["categorization_rules"]["Row"]
        >;
        Relationships: [
          {
            foreignKeyName: "categorization_rules_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      cards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          bank: string | null;
          limit_amount: number | null;
          closing_day: number;
          due_day: number;
          color: string | null;
          is_demo: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cards"]["Row"]> & {
          user_id: string;
          name: string;
          closing_day: number;
          due_day: number;
        };
        Update: Partial<Database["public"]["Tables"]["cards"]["Row"]>;
        Relationships: [];
      };
      card_invoices: {
        Row: {
          id: string;
          card_id: string;
          user_id: string;
          reference_month: string;
          total_amount: number;
          status: InvoiceStatus;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["card_invoices"]["Row"]
        > & {
          card_id: string;
          user_id: string;
          reference_month: string;
        };
        Update: Partial<Database["public"]["Tables"]["card_invoices"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "card_invoices_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          }
        ];
      };
      import_batches: {
        Row: {
          id: string;
          user_id: string;
          source_filename: string;
          file_type: ImportFileType;
          account_id: string | null;
          imported_at: string;
          status: ImportBatchStatus;
        };
        Insert: Partial<
          Database["public"]["Tables"]["import_batches"]["Row"]
        > & {
          user_id: string;
          source_filename: string;
          file_type: ImportFileType;
        };
        Update: Partial<Database["public"]["Tables"]["import_batches"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "import_batches_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          }
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          date: string;
          description: string;
          raw_description: string | null;
          amount: number;
          type: TransactionType;
          status: TransactionStatus;
          card_id: string | null;
          import_batch_id: string | null;
          dedupe_hash: string | null;
          is_demo: boolean;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["transactions"]["Row"]
        > & {
          user_id: string;
          account_id: string;
          date: string;
          description: string;
          amount: number;
          type: TransactionType;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_import_batch_id_fkey";
            columns: ["import_batch_id"];
            isOneToOne: false;
            referencedRelation: "import_batches";
            referencedColumns: ["id"];
          }
        ];
      };
      commitments: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          due_day: number;
          recurrence: Recurrence;
          category_id: string | null;
          is_active: boolean;
          is_demo: boolean;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["commitments"]["Row"]
        > & {
          user_id: string;
          name: string;
          amount: number;
          due_day: number;
        };
        Update: Partial<Database["public"]["Tables"]["commitments"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "commitments_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          monthly_contribution: number | null;
          is_demo: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["goals"]["Row"]> & {
          user_id: string;
          name: string;
          target_amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Row"]>;
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          role: ChatRole;
          content: string;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["chat_messages"]["Row"]
        > & {
          user_id: string;
          role: ChatRole;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      transactions_confirmed: {
        Row: Database["public"]["Tables"]["transactions"]["Row"];
        Relationships: Database["public"]["Tables"]["transactions"]["Relationships"];
      };
    };
    Functions: {
      create_default_categories: {
        Args: { p_user_id: string };
        Returns: void;
      };
      clear_demo_data: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CategorizationRule =
  Database["public"]["Tables"]["categorization_rules"]["Row"];
export type Card = Database["public"]["Tables"]["cards"]["Row"];
export type CardInvoice = Database["public"]["Tables"]["card_invoices"]["Row"];
export type ImportBatch =
  Database["public"]["Tables"]["import_batches"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Commitment = Database["public"]["Tables"]["commitments"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
