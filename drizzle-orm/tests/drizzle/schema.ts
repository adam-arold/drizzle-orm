import {
    boolean,
    index,
    jsonb,
    pgEnum,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uniqueIndex,
} from "~/pg-core";
import { relations } from "~/relations";

export const AccountProvider = pgEnum("AccountProvider", ["LOCAL", "DISCORD"]);

export const ConfigLevel = pgEnum("ConfigLevel", [
    "USER",
    "ORG",
    "TEAM",
    "MODULE",
]);

export const JobState = pgEnum("JobState", [
    "SCHEDULED",
    "RUNNING",
    "COMPLETED",
    "FAILED",
    "UNKNOWN",
    "CANCELED",
]);

export const User = pgTable(
    "User",
    {
        id: text("id").primaryKey().notNull(),
        email: text("email").notNull(),
        name: text("name").notNull(),
        roles: text("roles").array(),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
    },
    (table) => {
        return {
            email_idx: index("User_email_idx").using("btree", table.email),
            email_key: uniqueIndex("User_email_key").using(
                "btree",
                table.email,
            ),
        };
    },
);

export const UserRelations = relations(User, ({ many }) => ({
    accounts: many(Account),
    configs: many(Configuration),
    responses: many(DailySyncResponse),
    jobs: many(Job),
    // connections
    teams: many(UserToTeam),
    orgs: many(UserToOrganization),
}));

export const Account = pgTable(
    "Account",
    {
        provider: AccountProvider("provider").notNull(),
        userId: text("userId")
            .notNull()
            .references(() => User.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        providerId: text("providerId").notNull(),
        accessToken: text("accessToken"),
        refreshToken: text("refreshToken"),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
    },
    (table) => {
        return {
            providerId_key: uniqueIndex("Account_providerId_key").using(
                "btree",
                table.providerId,
            ),
            Account_pkey: primaryKey({
                columns: [table.provider, table.userId],
                name: "Account_pkey",
            }),
        };
    },
);

export const AccountRelations = relations(Account, ({ one }) => ({
    user: one(User, {
        fields: [Account.userId],
        references: [User.id],
    }),
}));

export const Organization = pgTable(
    "Organization",
    {
        id: text("id").primaryKey().notNull(),
        name: text("name").notNull(),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
    },
    (table) => {
        return {
            name_key: uniqueIndex("Organization_name_key").using(
                "btree",
                table.name,
            ),
        };
    },
);

export const OrganizationRelations = relations(Organization, ({ many }) => ({
    teams: many(Team),
    configs: many(Configuration),
    subscriptions: many(ModuleSubscription),
    // connections
    servers: many(ServerToOrganization),
    users: many(UserToOrganization),
    dailySyncChannels: many(DailySyncChannelConnection),
}));

export const Server = pgTable(
    "Server",
    {
        id: text("id").primaryKey().notNull(),
        provider: AccountProvider("provider").notNull(),
        providerId: text("providerId").notNull(),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
    },
    (table) => {
        return {
            providerId_key: uniqueIndex("Server_providerId_key").using(
                "btree",
                table.providerId,
            ),
        };
    },
);

export const ServerRelations = relations(Server, ({ many }) => ({
    channels: many(Channel),
    orgs: many(ServerToOrganization),
}));

export const Channel = pgTable(
    "Channel",
    {
        id: text("id").primaryKey().notNull(),
        providerId: text("providerId").notNull(),
        serverId: text("serverId")
            .notNull()
            .references(() => Server.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
    },
    (table) => {
        return {
            providerId_key: uniqueIndex("Channel_providerId_key").using(
                "btree",
                table.providerId,
            ),
        };
    },
);

export const ChannelRelations = relations(Channel, ({ one, many }) => ({
    server: one(Server, {
        fields: [Channel.serverId],
        references: [Server.id],
    }),
    dailySyncConnections: many(DailySyncChannelConnection),
}));

export const Module = pgTable(
    "Module",
    {
        id: text("id").primaryKey().notNull(),
        name: text("name").notNull(),
        version: text("version").notNull(),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
    },
    (table) => {
        return {
            name_version_key: uniqueIndex("Module_name_version_key").using(
                "btree",
                table.name,
                table.version,
            ),
            version_idx: index("Module_version_idx").using(
                "btree",
                table.version,
            ),
        };
    },
);

export const ModuleRelations = relations(Module, ({ many }) => ({
    configs: many(Configuration),
    subscriptions: many(ModuleSubscription),
}));

export const ModuleSubscription = pgTable("ModuleSubscription", {
    id: text("id").primaryKey().notNull(),
    orgId: text("orgId")
        .notNull()
        .references(() => Organization.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
    moduleId: text("moduleId")
        .notNull()
        .references(() => Module.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updatedAt", {
        precision: 3,
        mode: "string",
    }).notNull(),
});

export const ModuleSubscriptionRelations = relations(
    ModuleSubscription,
    ({ one }) => ({
        organization: one(Organization, {
            fields: [ModuleSubscription.orgId],
            references: [Organization.id],
        }),
        module: one(Module, {
            fields: [ModuleSubscription.moduleId],
            references: [Module.id],
        }),
    }),
);

export const Team = pgTable(
    "Team",
    {
        id: text("id").primaryKey().notNull(),
        name: text("name").notNull(),
        orgId: text("orgId")
            .notNull()
            .references(() => Organization.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
    },
    (table) => {
        return {
            name_orgId_key: uniqueIndex("Team_name_orgId_key").using(
                "btree",
                table.name,
                table.orgId,
            ),
        };
    },
);

export const TeamRelations = relations(Team, ({ one, many }) => ({
    organization: one(Organization, {
        fields: [Team.orgId],
        references: [Organization.id],
    }),
    configs: many(Configuration),
    dailySync: many(DailySync),
    // connections
    users: many(UserToTeam),
    dailySyncChannels: many(DailySyncChannelConnection),
}));

export const Configuration = pgTable(
    "Configuration",
    {
        id: text("id").primaryKey().notNull(),
        namespace: text("namespace").notNull(),
        key: text("key").notNull(),
        value: jsonb("value").notNull(),
        level: ConfigLevel("level").notNull(),
        relationId: text("relationId").notNull(),
        userId: text("userId").references(() => User.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
        orgId: text("orgId").references(() => Organization.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
        teamId: text("teamId").references(() => Team.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
        moduleId: text("moduleId").references(() => Module.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
    },
    (table) => {
        return {
            level_idx: index("Configuration_level_idx").using(
                "btree",
                table.level,
            ),
            namespace_key_level_idx: index(
                "Configuration_namespace_key_level_idx",
            ).using("btree", table.namespace, table.key, table.level),
            namespace_key_relationId_key: uniqueIndex(
                "Configuration_namespace_key_relationId_key",
            ).using("btree", table.namespace, table.key, table.relationId),
            relationId_idx: index("Configuration_relationId_idx").using(
                "btree",
                table.relationId,
            ),
        };
    },
);

export const ConfigRelations = relations(Configuration, ({ one }) => ({
    user: one(User, {
        fields: [Configuration.userId],
        references: [User.id],
    }),
    organization: one(Organization, {
        fields: [Configuration.orgId],
        references: [Organization.id],
    }),
    team: one(Team, {
        fields: [Configuration.teamId],
        references: [Team.id],
    }),
    module: one(Module, {
        fields: [Configuration.moduleId],
        references: [Module.id],
    }),
}));

// ========================
// ====== CONNECTORS ======
// ========================

export const UserToTeam = pgTable(
    "UserToTeam",
    {
        userId: text("userId")
            .notNull()
            .references(() => User.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        teamId: text("teamId")
            .notNull()
            .references(() => Team.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
    },
    (table) => {
        return {
            UserToTeam_pkey: primaryKey({
                columns: [table.userId, table.teamId],
                name: "UserToTeam_pkey",
            }),
        };
    },
);

export const UserToTeamRelations = relations(UserToTeam, ({ one }) => ({
    user: one(User, {
        fields: [UserToTeam.userId],
        references: [User.id],
    }),
    team: one(Team, {
        fields: [UserToTeam.teamId],
        references: [Team.id],
    }),
}));

export const UserToOrganization = pgTable(
    "UserToOrganization",
    {
        isOwner: boolean("isOwner").default(false).notNull(),
        userId: text("userId")
            .notNull()
            .references(() => User.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        orgId: text("orgId")
            .notNull()
            .references(() => Organization.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
    },
    (table) => {
        return {
            UserToOrganization_pkey: primaryKey({
                columns: [table.userId, table.orgId],
                name: "UserToOrganization_pkey",
            }),
        };
    },
);

export const UserToOrganizationRelations = relations(
    UserToOrganization,
    ({ one }) => ({
        user: one(User, {
            fields: [UserToOrganization.userId],
            references: [User.id],
        }),
        organization: one(Organization, {
            fields: [UserToOrganization.orgId],
            references: [Organization.id],
        }),
    }),
);
export const ServerToOrganization = pgTable(
    "ServerToOrganization",
    {
        provider: AccountProvider("provider").notNull(),
        serverId: text("serverId")
            .notNull()
            .references(() => Server.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        orgId: text("orgId")
            .notNull()
            .references(() => Organization.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
    },
    (table) => {
        return {
            ServerToOrganization_pkey: primaryKey({
                columns: [table.serverId, table.orgId],
                name: "ServerToOrganization_pkey",
            }),
        };
    },
);

export const ServerToOrganizationRelations = relations(
    ServerToOrganization,
    ({ one }) => ({
        server: one(Server, {
            fields: [ServerToOrganization.serverId],
            references: [Server.id],
        }),
        organization: one(Organization, {
            fields: [ServerToOrganization.orgId],
            references: [Organization.id],
        }),
    }),
);

export const DailySyncChannelConnection = pgTable(
    "DailySyncChannelConnection",
    {
        id: text("id").primaryKey().notNull(),
        channelId: text("channelId")
            .notNull()
            .references(() => Channel.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        orgId: text("orgId").references(() => Organization.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
        teamId: text("teamId").references(() => Team.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
    },
    (table) => {
        return {
            channelId_orgId_teamId_key: uniqueIndex(
                "DailySyncChannelConnection_channelId_orgId_teamId_key",
            ).using("btree", table.channelId, table.orgId, table.teamId),
        };
    },
);

export const DailySyncChannelConnectionRelations = relations(
    DailySyncChannelConnection,
    ({ one }) => ({
        channel: one(Channel, {
            fields: [DailySyncChannelConnection.channelId],
            references: [Channel.id],
        }),
        organization: one(Organization, {
            fields: [DailySyncChannelConnection.orgId],
            references: [Organization.id],
        }),
        team: one(Team, {
            fields: [DailySyncChannelConnection.teamId],
            references: [Team.id],
        }),
    }),
);

// ======================
// ======== JOB  ========
// ======================

export const Job = pgTable(
    "Job",
    {
        id: text("id").primaryKey().notNull(),
        name: text("name").notNull(),
        correlationId: text("correlationId").notNull(),
        type: text("type").notNull(),
        data: jsonb("data").notNull(),
        state: JobState("state").notNull(),
        scheduledAt: timestamp("scheduledAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
        executedById: text("executedById")
            .notNull()
            .references(() => User.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
        jobId: text("jobId"),
    },
    (table) => {
        return {
            correlationId_idx: index("Job_correlationId_idx").using(
                "btree",
                table.correlationId,
            ),
            scheduledAt_idx: index("Job_scheduledAt_idx").using(
                "btree",
                table.scheduledAt,
            ),
        };
    },
);

export const JobRelations = relations(Job, ({ one, many }) => ({
    log: many(JobLog),
    executedBy: one(User, {
        fields: [Job.executedById],
        references: [User.id],
    }),
    parents: many(Trace, { relationName: "parents" }),
    children: many(Trace, { relationName: "children" }),
}));

export const Trace = pgTable(
    "Trace",
    {
        childId: text("childId")
            .notNull()
            .references(() => Job.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
        parentId: text("parentId")
            .notNull()
            .references(() => Job.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
    },
    (table) => {
        return {
            Trace_pkey: primaryKey({
                columns: [table.childId, table.parentId],
                name: "Trace_pkey",
            }),
        };
    },
);

export const TraceRelations = relations(Trace, ({ one }) => ({
    parent: one(Job, {
        fields: [Trace.parentId],
        references: [Job.id],
        relationName: "parents",
    }),
    child: one(Job, {
        fields: [Trace.childId],
        references: [Job.id],
        relationName: "children",
    }),
}));

export const JobLog = pgTable("JobLog", {
    id: text("id").primaryKey().notNull(),
    note: text("note").notNull(),
    state: JobState("state").notNull(),
    type: text("type"),
    data: jsonb("data"),
    jobId: text("jobId")
        .notNull()
        .references(() => Job.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
        .defaultNow()
        .notNull(),
});

export const JobLogRelations = relations(JobLog, ({ one }) => ({
    job: one(Job, {
        fields: [JobLog.jobId],
        references: [Job.id],
    }),
}));

// =======================
// === MODULE-SPECIFIC ===
// =======================

export const DailySync = pgTable("DailySync", {
    id: text("id").primaryKey().notNull(),
    teamId: text("teamId")
        .notNull()
        .references(() => Team.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updatedAt", {
        precision: 3,
        mode: "string",
    }).notNull(),
});

export const DailySyncRelations = relations(DailySync, ({ one, many }) => ({
    team: one(Team, {
        fields: [DailySync.teamId],
        references: [Team.id],
    }),
    responses: many(DailySyncResponse),
}));

export const DailySyncResponse = pgTable(
    "DailySyncResponse",
    {
        id: text("id").primaryKey().notNull(),
        userId: text("userId")
            .notNull()
            .references(() => User.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        dailySyncId: text("dailySyncId")
            .notNull()
            .references(() => DailySync.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        yesterday: text("yesterday").notNull(),
        today: text("today").notNull(),
        blockers: text("blockers"),
        createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            precision: 3,
            mode: "string",
        }).notNull(),
    },
    (table) => {
        return {
            createdAt_idx: index("DailySyncResponse_createdAt_idx").using(
                "btree",
                table.createdAt,
            ),
            createdAt_key: uniqueIndex("DailySyncResponse_createdAt_key").using(
                "btree",
                table.createdAt,
            ),
            userId_idx: index("DailySyncResponse_userId_idx").using(
                "btree",
                table.userId,
            ),
        };
    },
);

export const DailySyncResponseRelations = relations(
    DailySyncResponse,
    ({ one }) => ({
        user: one(User, {
            fields: [DailySyncResponse.userId],
            references: [User.id]
        }),
        dailySync: one(DailySync, {
            fields: [DailySyncResponse.dailySyncId],
            references: [DailySync.id]
        }),
    }),
);
