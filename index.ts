export interface Client {
  id: number;
  client_name: string;
  domain_url: string;
  client_id: string;
  password?: string;
  original_password?: string;
  latest_pull_date: string | null;
  latest_pull_by: string | null;
  gsos_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface PullHistory {
  id: number;
  client_id: number;
  pull_date: string;
  pull_by: string;
  created_at: string;
}

export interface ClientFormData {
  client_name: string;
  domain_url: string;
  client_id: string;
  password: string;
  latest_pull_date: string;
  latest_pull_by: string;
  gsos_version: string;
}

export interface PullEntryData {
  pull_date: string;
  pull_by: string;
  version?: string;
}