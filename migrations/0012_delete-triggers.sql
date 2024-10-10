-- Custom SQL migration file, put you code below! --
CREATE OR REPLACE FUNCTION archive_deleted_row()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO archive (table_name, data)
    VALUES (TG_TABLE_NAME, to_jsonb(OLD));

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE TRIGGER before_client_delete
BEFORE DELETE ON client
FOR EACH ROW
EXECUTE FUNCTION archive_deleted_row();--> statement-breakpoint

CREATE TRIGGER before_account_delete
BEFORE DELETE ON account
FOR EACH ROW
EXECUTE FUNCTION archive_deleted_row();