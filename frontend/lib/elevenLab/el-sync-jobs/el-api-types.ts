export interface ElModel {
  model_id: string;
  name: string;
  description?: string;
  can_do_text_to_speech: boolean;
  languages: { language_id: string; name: string }[];
  max_characters_request_free_user: number;
  max_characters_request_subscribed_user: number;
  token_cost_factor?: number;
}

export interface ElVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
  labels?: Record<string, string>;
  fine_tuning?: { is_allowed_to_fine_tune: boolean; finetuning_state: string };
  safety_control?: string;
  sharing?: { status: string; enabled_in_library: boolean };
  high_quality_base_model_ids?: string[];
  verified_languages?: { language_id: string; model_id: string }[];
  available_for_tiers?: string[];
}

export interface ElSubscription {
  character_count: number;
  character_limit: number;
  voice_limit: number;
  professional_voice_limit: number;
  can_extend_character_limit: boolean;
  can_use_instant_voice_cloning: boolean;
  tier: string;
  next_character_count_reset_unix?: number;
}
