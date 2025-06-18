import {
    onPostAuthenticationEvent,
    WorkflowSettings,
    WorkflowTrigger,
    getEnvironmentVariable,
    createKindeAPI,
    fetch,
} from "@kinde/infrastructure";
import { MongoClient } from "mongodb";

const uri = getEnvironmentVariable("DB_STRING")?.value;

const client = new MongoClient(uri);

// The settings for this workflow
export const workflowSettings: WorkflowSettings = {
    id: "postAuthentication",
    name: "mongodb-new-user-workflow",
    failurePolicy: {
        action: "stop",
    },
    trigger: WorkflowTrigger.PostAuthentication,
    bindings: {
        "kinde.env": {},
        "kinde.fetch": {},
        url: {},
        "kinde.mfa": {}
    },
};

// This workflow requires you to set up the Kinde management API
// You can do this by going to the Kinde dashboard.
//
// Create an M2M application with the following scopes enabled:
// * read:user_properties
// * read:users
//
// In Settings -> Environment variables set up the following variables with the
// values from the M2M application you created above:
//
// * KINDE_WF_M2M_CLIENT_ID
// * KINDE_WF_M2M_CLIENT_SECRET - Ensure this is setup with sensitive flag
// enabled to prevent accidental sharing
//
// Add 2 more variables with the following keys:
// * HUBSPOT_TOKEN - The token for the Hubspot API
// * HUBSPOT_CONTACT_OWNER_ID - The ID of the Hubspot contact owner
// This will be used to set the owner of the contact in Hubspot.

// The workflow code to be executed when the event is triggered
export default async function handlePostAuth(event: onPostAuthenticationEvent) {
    const isNewKindeUser = event.context.auth.isNewUserRecordCreated;

    // The user has been added to the Kinde user pool for the first time
    if (isNewKindeUser) {
        // Get a token for Kinde management API
        const kindeAPI = await createKindeAPI(event);

        const userId = event.context.user.id;

        // call user api
        const { data: user } = await kindeAPI.get({
            endpoint: `user?id=${userId}`,
        });

        // Map the Kinde user data to Hubspot properties
        const properties = {
            id: user.id,
            email: user.preferred_email,
            firstname: user.first_name,
            lastname: user.last_name,
        };

        try {
            const db = client.db("cadet");
            const result = await db.collection("user").insertOne(properties);
            console.log(result);
        } finally {
            // Close the database connection on completion or error
            await client.close();
        }
    }
}