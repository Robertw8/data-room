-- Nested files are unique within their Data Room folder.
CREATE UNIQUE INDEX "File_dataRoomId_folderId_name_key"
ON "File"("dataRoomId", "folderId", "name")
WHERE "folderId" IS NOT NULL;

-- PostgreSQL treats NULL values as distinct in a regular unique index, so
-- Data Room root files need a separate partial unique index.
CREATE UNIQUE INDEX "File_dataRoomId_name_root_key"
ON "File"("dataRoomId", "name")
WHERE "folderId" IS NULL;
