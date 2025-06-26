import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// Fake auth function replace with your actual auth logic
const auth = (req: Request) => ({ id: "admin" }); 

export const ourFileRouter = {
  // Image uploader for events
    imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async ({ req }) => {
        const user = auth(req);
        //authentification
        if (!user) throw new UploadThingError("Unauthorized");
        return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
        console.log("Upload complete for userId:", metadata.userId);
        console.log("File URL:", file.url);
        return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;
export type OurFileRouter = typeof ourFileRouter;