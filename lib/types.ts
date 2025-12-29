export type TimeHorizon = "now" | "soon" | "later" | "someday"

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  time_horizon: TimeHorizon
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
  position: number
  parent_task_id: string | null
}

export interface Snapshot {
  id: string
  user_id: string
  title: string
  description: string | null
  snapshot_data: {
    tasks: Task[]
    created_at: string
  }
  created_at: string
}
