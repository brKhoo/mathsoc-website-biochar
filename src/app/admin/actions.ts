"use server";

import { EXAMS_BUCKET_NAME } from "./components/util/exam-config";
import mockExamsList from "./components/util/mock-exams-list.json";
import { Storage } from "@google-cloud/storage";
import { Exam } from "./types";
import { fetchFromExamBankWorker } from "../api/exam-bank-worker";
import { protectToAdmins, protectToStudents } from "../auth.actions";

const shouldUseMockData = () => {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return process.env.USE_LIVE_DATA_ON_DEV === "true";
};

const storage = new Storage();

export const listExamsAction = async (): Promise<Exam[]> => {
  if (shouldUseMockData()) {
    return mockExamsList as Exam[];
  }

  const session = await protectToStudents("/resources/exam-bank");
  const res = await fetchFromExamBankWorker(session, {
    method: "list-exams",
    uid: session.user?.email,
  });

  const { exams } = JSON.parse(await res.text());
  return exams;
};

export const postExamsAction = async (formData: FormData) => {
  const session = await protectToAdmins("/admin");

  await fetchFromExamBankWorker(
    session,
    {
      method: "upload-exams",
    },
    { body: formData, method: "POST" },
  );
};

// @todo protect with authentication
export const deleteExamAction = async (file: string) => {
  if (shouldUseMockData()) {
    throw new Error(
      `Do not meddle with exams unless you know what you are doing!`,
    );
  }

  console.log(`Deleting ${file}...`);
  await storage.bucket(EXAMS_BUCKET_NAME).file(file).delete();
};
