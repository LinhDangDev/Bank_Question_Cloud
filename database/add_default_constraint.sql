-- Add default constraint for MaDeThi column in DeThi table
-- This script adds a default constraint to automatically generate UUIDs for new records

USE [question_bank]
GO

-- Check if the default constraint already exists
IF NOT EXISTS (
    SELECT * FROM sys.default_constraints
    WHERE name = 'DF_DeThi_MaDeThi'
    AND parent_object_id = OBJECT_ID('DeThi')
)
BEGIN
    -- Add default constraint for MaDeThi column
    ALTER TABLE [dbo].[DeThi]
    ADD CONSTRAINT [DF_DeThi_MaDeThi]
    DEFAULT (NEWID()) FOR [MaDeThi]

    PRINT 'Default constraint DF_DeThi_MaDeThi added successfully'
END
ELSE
BEGIN
    PRINT 'Default constraint DF_DeThi_MaDeThi already exists'
END
GO
