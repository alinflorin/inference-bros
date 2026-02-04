resource "minio_s3_bucket" "pvc_bucket" {
  bucket = "pvc${var.location}"

  count = var.create_s3_buckets ? 1 : 0
}

resource "minio_s3_bucket" "velero_bucket" {
  bucket = "velero${var.location}"

  count = var.create_s3_buckets ? 1 : 0
}