-- Nested folders are unique among siblings in the same Data Room.
CREATE UNIQUE INDEX "Folder_dataRoomId_parentId_name_key"
ON "Folder"("dataRoomId", "parentId", "name")
WHERE "parentId" IS NOT NULL;

-- PostgreSQL treats NULL values as distinct in a regular unique index, so
-- Data Room root folders need a separate partial unique index.
CREATE UNIQUE INDEX "Folder_dataRoomId_name_root_key"
ON "Folder"("dataRoomId", "name")
WHERE "parentId" IS NULL;
