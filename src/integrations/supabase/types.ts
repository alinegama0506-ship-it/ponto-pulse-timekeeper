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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      colaborador_locais: {
        Row: {
          local_id: string
          user_id: string
        }
        Insert: {
          local_id: string
          user_id: string
        }
        Update: {
          local_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_locais_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_trabalho"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_locais_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locais_trabalho: {
        Row: {
          ativo: boolean
          endereco: string
          id: string
          latitude: number
          longitude: number
          nome: string
          raio_m: number
        }
        Insert: {
          ativo?: boolean
          endereco?: string
          id?: string
          latitude: number
          longitude: number
          nome: string
          raio_m?: number
        }
        Update: {
          ativo?: boolean
          endereco?: string
          id?: string
          latitude?: number
          longitude?: number
          nome?: string
          raio_m?: number
        }
        Relationships: []
      }
      marcacoes: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          data_local: string
          distancia_m: number | null
          divergencia_relogio_s: number | null
          geo_justificativa: string | null
          geo_status: string
          hora_local: string
          id: string
          latitude: number | null
          local_id: string | null
          longitude: number | null
          momento_dispositivo: string
          origem: string
          precisao_m: number | null
          solicitacao_id: string | null
          timezone: string | null
          tipo: Database["public"]["Enums"]["tipo_marcacao"]
          tz_offset_min: number
          user_id: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data_local: string
          distancia_m?: number | null
          divergencia_relogio_s?: number | null
          geo_justificativa?: string | null
          geo_status?: string
          hora_local: string
          id?: string
          latitude?: number | null
          local_id?: string | null
          longitude?: number | null
          momento_dispositivo: string
          origem?: string
          precisao_m?: number | null
          solicitacao_id?: string | null
          timezone?: string | null
          tipo: Database["public"]["Enums"]["tipo_marcacao"]
          tz_offset_min: number
          user_id?: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data_local?: string
          distancia_m?: number | null
          divergencia_relogio_s?: number | null
          geo_justificativa?: string | null
          geo_status?: string
          hora_local?: string
          id?: string
          latitude?: number | null
          local_id?: string | null
          longitude?: number | null
          momento_dispositivo?: string
          origem?: string
          precisao_m?: number | null
          solicitacao_id?: string | null
          timezone?: string | null
          tipo?: Database["public"]["Enums"]["tipo_marcacao"]
          tz_offset_min?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marcacoes_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_trabalho"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marcacoes_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          acessibilidade: Json
          ativo: boolean
          cargo: string | null
          created_at: string
          email: string | null
          geo_aviso_visto_em: string | null
          id: string
          idioma: string
          modalidade: string
          nome: string
          notificacoes: Json
        }
        Insert: {
          acessibilidade?: Json
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          email?: string | null
          geo_aviso_visto_em?: string | null
          id: string
          idioma?: string
          modalidade?: string
          nome?: string
          notificacoes?: Json
        }
        Update: {
          acessibilidade?: Json
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          email?: string | null
          geo_aviso_visto_em?: string | null
          id?: string
          idioma?: string
          modalidade?: string
          nome?: string
          notificacoes?: Json
        }
        Relationships: []
      }
      regras: {
        Row: {
          atualizado_em: string
          divergencia_max_s: number
          geo_aviso: string
          geo_modo: string
          id: number
          jornada_diaria_min: number
          limite_diario_min: number
          precisao_max_m: number
          tolerancia_min: number
          validade_banco_dias: number
        }
        Insert: {
          atualizado_em?: string
          divergencia_max_s?: number
          geo_aviso?: string
          geo_modo?: string
          id?: number
          jornada_diaria_min?: number
          limite_diario_min?: number
          precisao_max_m?: number
          tolerancia_min?: number
          validade_banco_dias?: number
        }
        Update: {
          atualizado_em?: string
          divergencia_max_s?: number
          geo_aviso?: string
          geo_modo?: string
          id?: number
          jornada_diaria_min?: number
          limite_diario_min?: number
          precisao_max_m?: number
          tolerancia_min?: number
          validade_banco_dias?: number
        }
        Relationships: []
      }
      solicitacoes: {
        Row: {
          created_at: string
          data_solicitada: string
          decidido_em: string | null
          decidido_por: string | null
          hora_solicitada: string
          id: string
          justificativa_rejeicao: string | null
          motivo: Database["public"]["Enums"]["motivo_ajuste"]
          observacao: string | null
          status: Database["public"]["Enums"]["status_solicitacao"]
          tipo: Database["public"]["Enums"]["tipo_marcacao"]
          tz_offset_min: number
          user_id: string
        }
        Insert: {
          created_at?: string
          data_solicitada: string
          decidido_em?: string | null
          decidido_por?: string | null
          hora_solicitada: string
          id?: string
          justificativa_rejeicao?: string | null
          motivo: Database["public"]["Enums"]["motivo_ajuste"]
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_solicitacao"]
          tipo: Database["public"]["Enums"]["tipo_marcacao"]
          tz_offset_min?: number
          user_id?: string
        }
        Update: {
          created_at?: string
          data_solicitada?: string
          decidido_em?: string | null
          decidido_por?: string | null
          hora_solicitada?: string
          id?: string
          justificativa_rejeicao?: string | null
          motivo?: Database["public"]["Enums"]["motivo_ajuste"]
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_solicitacao"]
          tipo?: Database["public"]["Enums"]["tipo_marcacao"]
          tz_offset_min?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      avaliar_localizacao: {
        Args: {
          _falha?: string
          _latitude?: number
          _longitude?: number
          _precisao_m?: number
        }
        Returns: Json
      }
      calcular_geo: {
        Args: {
          _falha: string
          _latitude: number
          _longitude: number
          _precisao_m: number
          _uid: string
        }
        Returns: Json
      }
      decidir_solicitacao: {
        Args: { _aprovar: boolean; _id: string; _justificativa?: string }
        Returns: undefined
      }
      definir_gestor: {
        Args: { _gestor: boolean; _user_id: string }
        Returns: undefined
      }
      distancia_haversine: {
        Args: { _lat1: number; _lat2: number; _lng1: number; _lng2: number }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      registrar_ciencia_geo: { Args: never; Returns: string }
      registrar_marcacao: {
        Args: {
          _data_local: string
          _falha?: string
          _hora_local: string
          _justificativa?: string
          _latitude?: number
          _longitude?: number
          _momento_dispositivo: string
          _precisao_m?: number
          _timezone?: string
          _tipo: Database["public"]["Enums"]["tipo_marcacao"]
          _tz_offset_min: number
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "colaborador" | "gestor"
      motivo_ajuste:
        | "esquecimento"
        | "falha_sistema"
        | "conexao"
        | "dispositivo"
        | "atividade_externa"
        | "outro"
      status_solicitacao: "pendente" | "aprovado" | "rejeitado"
      tipo_marcacao:
        | "entrada"
        | "saida_intervalo"
        | "retorno_intervalo"
        | "saida"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["colaborador", "gestor"],
      motivo_ajuste: [
        "esquecimento",
        "falha_sistema",
        "conexao",
        "dispositivo",
        "atividade_externa",
        "outro",
      ],
      status_solicitacao: ["pendente", "aprovado", "rejeitado"],
      tipo_marcacao: [
        "entrada",
        "saida_intervalo",
        "retorno_intervalo",
        "saida",
      ],
    },
  },
} as const
