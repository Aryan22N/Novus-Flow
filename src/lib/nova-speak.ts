export async function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate  = 1;
    utterance.pitch = 1;

    const voices    = speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.name.includes("Google")) ??
      voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => resolve();
    speechSynthesis.speak(utterance);
  });
}
