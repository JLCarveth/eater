import { Alert } from "./ui/Alert.tsx";

interface Props {
  error: string | null | undefined;
}

export default function ErrorAlert({ error }: Props) {
  if (!error) return null;
  return <Alert variant="error" message={error} />;
}
