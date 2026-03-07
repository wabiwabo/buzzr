export enum ComplaintCategory {
  ILLEGAL_DUMPING = 'illegal_dumping',
  TPS_FULL = 'tps_full',
  MISSED_PICKUP = 'missed_pickup',
  OTHER = 'other',
}

export enum ComplaintStatus {
  SUBMITTED = 'submitted',
  VERIFIED = 'verified',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}
