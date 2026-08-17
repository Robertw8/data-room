ALTER TABLE "Share"
ADD CONSTRAINT "Share_exactly_one_target_check"
CHECK (
  (CASE WHEN "dataRoomId" IS NOT NULL THEN 1 ELSE 0 END) +
  (CASE WHEN "folderId" IS NOT NULL THEN 1 ELSE 0 END) +
  (CASE WHEN "fileId" IS NOT NULL THEN 1 ELSE 0 END) = 1
);
