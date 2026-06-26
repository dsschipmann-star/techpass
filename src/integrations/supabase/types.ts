export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cashback_movements: {
        Row: {
          cliente_id: string
          created_at: string
          descricao: string | null
          id: string
          techpass_id: string
          tipo: Database["public"]["Enums"]["cashback_tipo"]
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          techpass_id: string
          tipo: Database["public"]["Enums"]["cashback_tipo"]
          valor: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          techpass_id?: string
          tipo?: Database["public"]["Enums"]["cashback_tipo"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cashback_movements_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashback_movements_techpass_id_fkey"
            columns: ["techpass_id"]
            isOneToOne: false
            referencedRelation: "techpass"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          codigo_indicacao: string | null
          cpf: string
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          codigo_indicacao?: string | null
          cpf: string
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          codigo_indicacao?: string | null
          cpf?: string
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          responsavel: string | null
          status: Database["public"]["Enums"]["empresa_status"]
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          responsavel?: string | null
          status?: Database["public"]["Enums"]["empresa_status"]
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          responsavel?: string | null
          status?: Database["public"]["Enums"]["empresa_status"]
          telefone?: string | null
        }
        Relationships: []
      }
      indicacoes: {
        Row: {
          cliente_indicador_id: string
          created_at: string
          id: string
          nome_indicado: string
          observacao: string | null
          recompensa: Database["public"]["Enums"]["indicacao_recompensa"] | null
          status: Database["public"]["Enums"]["indicacao_status"]
          telefone_indicado: string | null
          valor_servico: number | null
        }
        Insert: {
          cliente_indicador_id: string
          created_at?: string
          id?: string
          nome_indicado: string
          observacao?: string | null
          recompensa?:
            | Database["public"]["Enums"]["indicacao_recompensa"]
            | null
          status?: Database["public"]["Enums"]["indicacao_status"]
          telefone_indicado?: string | null
          valor_servico?: number | null
        }
        Update: {
          cliente_indicador_id?: string
          created_at?: string
          id?: string
          nome_indicado?: string
          observacao?: string | null
          recompensa?:
            | Database["public"]["Enums"]["indicacao_recompensa"]
            | null
          status?: Database["public"]["Enums"]["indicacao_status"]
          telefone_indicado?: string | null
          valor_servico?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "indicacoes_cliente_indicador_id_fkey"
            columns: ["cliente_indicador_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      techpass: {
        Row: {
          activated_at: string | null
          cliente_id: string | null
          created_at: string
          empresa_id: string
          expires_at: string | null
          id: string
          peliculas_restantes: number
          qr_code_url: string
          serial: string
          status: Database["public"]["Enums"]["techpass_status"]
        }
        Insert: {
          activated_at?: string | null
          cliente_id?: string | null
          created_at?: string
          empresa_id: string
          expires_at?: string | null
          id?: string
          peliculas_restantes?: number
          qr_code_url: string
          serial: string
          status?: Database["public"]["Enums"]["techpass_status"]
        }
        Update: {
          activated_at?: string | null
          cliente_id?: string | null
          created_at?: string
          empresa_id?: string
          expires_at?: string | null
          id?: string
          peliculas_restantes?: number
          qr_code_url?: string
          serial?: string
          status?: Database["public"]["Enums"]["techpass_status"]
        }
        Relationships: [
          {
            foreignKeyName: "techpass_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "techpass_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      utilizacoes: {
        Row: {
          beneficio: string
          cliente_id: string
          created_at: string
          id: string
          observacao: string | null
          techpass_id: string
        }
        Insert: {
          beneficio: string
          cliente_id: string
          created_at?: string
          id?: string
          observacao?: string | null
          techpass_id: string
        }
        Update: {
          beneficio?: string
          cliente_id?: string
          created_at?: string
          id?: string
          observacao?: string | null
          techpass_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utilizacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utilizacoes_techpass_id_fkey"
            columns: ["techpass_id"]
            isOneToOne: false
            referencedRelation: "techpass"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cashback_tipo: "credito" | "debito"
      empresa_status: "ativa" | "inativa"
      indicacao_recompensa: "desconto" | "cashback" | "brinde"
      indicacao_status: "pendente" | "aprovado" | "recusado"
      techpass_status:
        | "AGUARDANDO_ATIVACAO"
        | "ATIVO"
        | "SUSPENSO"
        | "CANCELADO"
        | "EXPIRADO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cashback_tipo: ["credito", "debito"],
      empresa_status: ["ativa", "inativa"],
      indicacao_recompensa: ["desconto", "cashback", "brinde"],
      indicacao_status: ["pendente", "aprovado", "recusado"],
      techpass_status: [
        "AGUARDANDO_ATIVACAO",
        "ATIVO",
        "SUSPENSO",
        "CANCELADO",
        "EXPIRADO",
      ],
    },
  },
} as const
