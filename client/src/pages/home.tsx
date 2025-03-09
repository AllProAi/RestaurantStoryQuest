import { Layout } from "@/components/layout/Layout";
import { QuestionnaireForm } from "@/components/questionnaire/QuestionnaireForm";
import { WelcomeModal } from "@/components/WelcomeModal";

export default function Home() {
  return (
    <Layout>
      <WelcomeModal />
      <QuestionnaireForm />
    </Layout>
  );
}