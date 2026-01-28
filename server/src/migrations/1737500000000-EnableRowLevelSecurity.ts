import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableRowLevelSecurity1737500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // PART 1: Create helper functions for JWT-based authentication
    // ============================================================

    // Create auth schema if not exists (Supabase usually has this)
    await queryRunner.query(`
      CREATE SCHEMA IF NOT EXISTS auth;
    `);

    // Function to get current user ID from JWT claims
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION auth.user_id() RETURNS INTEGER AS $$
        SELECT COALESCE(
          (current_setting('request.jwt.claims', true)::json->>'sub')::integer,
          NULL
        );
      $$ LANGUAGE SQL STABLE;
    `);

    // Function to get current user role from JWT claims
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
        SELECT COALESCE(
          current_setting('request.jwt.claims', true)::json->>'role',
          'anon'
        );
      $$ LANGUAGE SQL STABLE;
    `);

    // Helper function to check admin or moderator role
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION auth.is_admin_or_moderator() RETURNS BOOLEAN AS $$
        SELECT auth.user_role() IN ('admin', 'moderator', 'ADMIN', 'MODERATOR');
      $$ LANGUAGE SQL STABLE;
    `);

    // Helper function to check admin role
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION auth.is_admin() RETURNS BOOLEAN AS $$
        SELECT auth.user_role() IN ('admin', 'ADMIN');
      $$ LANGUAGE SQL STABLE;
    `);

    // ============================================================
    // PART 2: Enable RLS on critical tables (sensitive data)
    // ============================================================

    // USER TABLE - Contains sensitive fields (password, tokens)
    await queryRunner.query(`ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;`);

    await queryRunner.query(`
      CREATE POLICY "user_select_own" ON "user"
        FOR SELECT USING (id = auth.user_id() OR auth.is_admin());
    `);

    await queryRunner.query(`
      CREATE POLICY "user_update_own" ON "user"
        FOR UPDATE USING (id = auth.user_id())
        WITH CHECK (id = auth.user_id());
    `);

    await queryRunner.query(`
      CREATE POLICY "user_admin_all" ON "user"
        FOR ALL USING (auth.is_admin())
        WITH CHECK (auth.is_admin());
    `);

    // DONATION TABLE - Sensitive financial data
    const donationExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'donation'
      );
    `);

    if (donationExists[0]?.exists) {
      await queryRunner.query(
        `ALTER TABLE donation ENABLE ROW LEVEL SECURITY;`,
      );

      await queryRunner.query(`
        CREATE POLICY "donation_select_own" ON donation
          FOR SELECT USING ("userId" = auth.user_id() OR auth.is_admin());
      `);

      await queryRunner.query(`
        CREATE POLICY "donation_admin_all" ON donation
          FOR ALL USING (auth.is_admin())
          WITH CHECK (auth.is_admin());
      `);
    }

    // ============================================================
    // PART 3: Enable RLS on public content tables
    // ============================================================

    const publicContentTables = [
      'volume',
      'character',
      'arc',
      'gamble',
      'chapter',
      'organization',
      'quote',
      'tag',
      'badge',
    ];

    for (const table of publicContentTables) {
      const tableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = '${table}'
        );
      `);

      if (tableExists[0]?.exists) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`,
        );

        await queryRunner.query(`
          CREATE POLICY "${table}_select_all" ON "${table}"
            FOR SELECT USING (true);
        `);

        await queryRunner.query(`
          CREATE POLICY "${table}_admin_mod_write" ON "${table}"
            FOR ALL USING (auth.is_admin_or_moderator())
            WITH CHECK (auth.is_admin_or_moderator());
        `);
      }
    }

    // ============================================================
    // PART 4: Enable RLS on user-submitted content tables
    // ============================================================

    // GUIDE TABLE
    const guideExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'guide'
      );
    `);

    if (guideExists[0]?.exists) {
      await queryRunner.query(`ALTER TABLE guide ENABLE ROW LEVEL SECURITY;`);

      await queryRunner.query(`
        CREATE POLICY "guide_select" ON guide
          FOR SELECT USING (
            status = 'approved'
            OR "authorId" = auth.user_id()
            OR auth.is_admin_or_moderator()
          );
      `);

      await queryRunner.query(`
        CREATE POLICY "guide_insert" ON guide
          FOR INSERT WITH CHECK (
            auth.user_id() IS NOT NULL
            AND "authorId" = auth.user_id()
          );
      `);

      await queryRunner.query(`
        CREATE POLICY "guide_update_own" ON guide
          FOR UPDATE USING (
            "authorId" = auth.user_id()
            AND status IN ('pending', 'rejected')
          )
          WITH CHECK ("authorId" = auth.user_id());
      `);

      await queryRunner.query(`
        CREATE POLICY "guide_delete_own_pending" ON guide
          FOR DELETE USING (
            "authorId" = auth.user_id()
            AND status = 'pending'
          );
      `);

      await queryRunner.query(`
        CREATE POLICY "guide_admin_mod_all" ON guide
          FOR ALL USING (auth.is_admin_or_moderator())
          WITH CHECK (auth.is_admin_or_moderator());
      `);
    }

    // MEDIA TABLE
    const mediaExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'media'
      );
    `);

    if (mediaExists[0]?.exists) {
      await queryRunner.query(`ALTER TABLE media ENABLE ROW LEVEL SECURITY;`);

      await queryRunner.query(`
        CREATE POLICY "media_select" ON media
          FOR SELECT USING (
            status = 'approved'
            OR "submittedById" = auth.user_id()
            OR auth.is_admin_or_moderator()
          );
      `);

      await queryRunner.query(`
        CREATE POLICY "media_insert" ON media
          FOR INSERT WITH CHECK (auth.user_id() IS NOT NULL);
      `);

      await queryRunner.query(`
        CREATE POLICY "media_admin_mod_all" ON media
          FOR ALL USING (auth.is_admin_or_moderator())
          WITH CHECK (auth.is_admin_or_moderator());
      `);
    }

    // ANNOTATION TABLE
    const annotationExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'annotation'
      );
    `);

    if (annotationExists[0]?.exists) {
      await queryRunner.query(
        `ALTER TABLE annotation ENABLE ROW LEVEL SECURITY;`,
      );

      await queryRunner.query(`
        CREATE POLICY "annotation_select" ON annotation
          FOR SELECT USING (
            status = 'approved'
            OR "authorId" = auth.user_id()
            OR auth.is_admin_or_moderator()
          );
      `);

      await queryRunner.query(`
        CREATE POLICY "annotation_insert" ON annotation
          FOR INSERT WITH CHECK (
            auth.user_id() IS NOT NULL
            AND "authorId" = auth.user_id()
          );
      `);

      await queryRunner.query(`
        CREATE POLICY "annotation_update_own" ON annotation
          FOR UPDATE USING (
            "authorId" = auth.user_id()
            AND status IN ('pending', 'rejected')
          )
          WITH CHECK ("authorId" = auth.user_id());
      `);

      await queryRunner.query(`
        CREATE POLICY "annotation_admin_mod_all" ON annotation
          FOR ALL USING (auth.is_admin_or_moderator())
          WITH CHECK (auth.is_admin_or_moderator());
      `);
    }

    // EVENT TABLE
    const eventExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'event'
      );
    `);

    if (eventExists[0]?.exists) {
      await queryRunner.query(`ALTER TABLE event ENABLE ROW LEVEL SECURITY;`);

      await queryRunner.query(`
        CREATE POLICY "event_select" ON event
          FOR SELECT USING (
            status = 'approved'
            OR "createdById" = auth.user_id()
            OR auth.is_admin_or_moderator()
          );
      `);

      await queryRunner.query(`
        CREATE POLICY "event_insert" ON event
          FOR INSERT WITH CHECK (auth.user_id() IS NOT NULL);
      `);

      await queryRunner.query(`
        CREATE POLICY "event_admin_mod_all" ON event
          FOR ALL USING (auth.is_admin_or_moderator())
          WITH CHECK (auth.is_admin_or_moderator());
      `);
    }

    // ============================================================
    // PART 5: Enable RLS on join/relationship tables
    // ============================================================

    const joinTables = [
      'character_organization',
      'character_relationship',
      'user_badge',
      'page_view',
      'guide_tags',
      'guide_characters',
      'guide_gambles',
      'event_characters_character',
      'gamble_participants_character',
    ];

    for (const table of joinTables) {
      const tableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = '${table}'
        );
      `);

      if (tableExists[0]?.exists) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`,
        );

        await queryRunner.query(`
          CREATE POLICY "${table}_select_all" ON "${table}"
            FOR SELECT USING (true);
        `);

        await queryRunner.query(`
          CREATE POLICY "${table}_admin_mod_write" ON "${table}"
            FOR ALL USING (auth.is_admin_or_moderator())
            WITH CHECK (auth.is_admin_or_moderator());
        `);
      }
    }

    // GUIDE_LIKE TABLE - Users manage their own likes
    const guideLikeExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'guide_like'
      );
    `);

    if (guideLikeExists[0]?.exists) {
      await queryRunner.query(
        `ALTER TABLE guide_like ENABLE ROW LEVEL SECURITY;`,
      );

      await queryRunner.query(`
        CREATE POLICY "guide_like_select_all" ON guide_like
          FOR SELECT USING (true);
      `);

      await queryRunner.query(`
        CREATE POLICY "guide_like_user_manage_own" ON guide_like
          FOR ALL USING ("userId" = auth.user_id())
          WITH CHECK ("userId" = auth.user_id());
      `);

      await queryRunner.query(`
        CREATE POLICY "guide_like_admin_all" ON guide_like
          FOR ALL USING (auth.is_admin())
          WITH CHECK (auth.is_admin());
      `);
    }

    // EDIT_LOG TABLE - Read only for moderators/admins
    const editLogExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'edit_log'
      );
    `);

    if (editLogExists[0]?.exists) {
      await queryRunner.query(
        `ALTER TABLE edit_log ENABLE ROW LEVEL SECURITY;`,
      );

      await queryRunner.query(`
        CREATE POLICY "edit_log_select_admin_mod" ON edit_log
          FOR SELECT USING (auth.is_admin_or_moderator());
      `);

      await queryRunner.query(`
        CREATE POLICY "edit_log_admin_write" ON edit_log
          FOR ALL USING (auth.is_admin())
          WITH CHECK (auth.is_admin());
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // Disable RLS and drop policies in reverse order
    // ============================================================

    const allTables = [
      'user',
      'donation',
      'volume',
      'character',
      'arc',
      'gamble',
      'chapter',
      'organization',
      'quote',
      'tag',
      'badge',
      'guide',
      'media',
      'annotation',
      'event',
      'character_organization',
      'character_relationship',
      'user_badge',
      'page_view',
      'guide_tags',
      'guide_characters',
      'guide_gambles',
      'event_characters_character',
      'gamble_participants_character',
      'guide_like',
      'edit_log',
    ];

    for (const table of allTables) {
      // Check if table exists
      const tableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = '${table}'
        );
      `);

      if (tableExists[0]?.exists) {
        // Drop all policies for this table
        const policies = await queryRunner.query(`
          SELECT policyname FROM pg_policies
          WHERE schemaname = 'public' AND tablename = '${table}';
        `);

        for (const policy of policies) {
          await queryRunner.query(`
            DROP POLICY IF EXISTS "${policy.policyname}" ON "${table}";
          `);
        }

        // Disable RLS
        await queryRunner.query(
          `ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`,
        );
      }
    }

    // Drop helper functions
    await queryRunner.query(`DROP FUNCTION IF EXISTS auth.is_admin();`);
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS auth.is_admin_or_moderator();`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS auth.user_role();`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS auth.user_id();`);
  }
}
