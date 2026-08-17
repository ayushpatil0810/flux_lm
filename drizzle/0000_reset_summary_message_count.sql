-- Custom SQL migration file, put your code below! --
-- Reset summaryMessageCount for all existing conversations.
-- Prior to this migration, summaryMessageCount tracked total message count.
-- It now tracks messages-since-last-summary and is reset to 0 on summarisation.
UPDATE conversation SET summary_message_count = 0;