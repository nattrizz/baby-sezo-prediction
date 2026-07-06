"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import ChartsSummary from "./ChartsSummary";


type EventRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  close_date: string | null;
  show_leaderboard: boolean;
  accept_predictions: boolean;
  accent: string;
};

type QuestionRow = {
  id: string;
  event_id: string;
  label: string;
  question_type: string;
  scoring_type: string;
  points: number;
  sort_order: number;
  options: string[] | null;
};

type PublicPredictionRow = {
  id: string;
  event_id: string;
  first_name: string;
  created_at: string;
};

type PublicAnswerRow = {
  id: string;
  event_id: string;
  prediction_id: string;
  question_label: string;
  answer_value: string;
  sort_order: number;
};

function colorClass(accent: string) {
  if (accent === "sky") return "bg-sky-100";
  if (accent === "sage") return "bg-emerald-100";
  if (accent === "peach") return "bg-orange-100";
  return "bg-emerald-100";
}

export default function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState("");
  const [eventRow, setEventRow] = useState<EventRow | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [publicPredictions, setPublicPredictions] = useState<PublicPredictionRow[]>([]);
  const [publicAnswers, setPublicAnswers] = useState<PublicAnswerRow[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    async function loadPage() {
      setLoading(true);

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();

      if (eventError || !eventData) {
        setLoading(false);
        return;
      }

      setEventRow(eventData);

      const { data: questionData } = await supabase
        .from("questions")
        .select("*")
        .eq("event_id", eventData.id)
        .order("sort_order", { ascending: true });

      setQuestions((questionData as QuestionRow[]) || []);

      const alreadySubmitted =
  localStorage.getItem(`${slug}-submitted`) === "true";
      setSubmitted(alreadySubmitted);

      if (alreadySubmitted) {
        await loadPublicGuesses(eventData.id);
      }

      setLoading(false);
    }

    loadPage();
  }, [slug]);

  async function loadPublicGuesses(eventId: string) {
    const { data: predictionData } = await supabase
      .from("public_predictions")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    const { data: answerData } = await supabase
      .from("public_prediction_answers")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true });

    setPublicPredictions((predictionData as PublicPredictionRow[]) || []);
    setPublicAnswers((answerData as PublicAnswerRow[]) || []);
  }

  const groupedGuesses = useMemo(() => {
    return publicPredictions.map((prediction) => ({
      ...prediction,
      answers: publicAnswers.filter(
        (answer) => answer.prediction_id === prediction.id
      ),
    }));
  }, [publicPredictions, publicAnswers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!eventRow) return;
    if (!name.trim()) {
      setSubmitError("Please enter your name.");
      return;
    }

    for (const question of questions) {
      if (!answers[question.id]?.trim()) {
        setSubmitError("Please answer all questions.");
        return;
      }
    }

    const predictionId = crypto.randomUUID();

const { error: predictionError } = await supabase
  .from("predictions")
  .insert({
    id: predictionId,
    event_id: eventRow.id,
    guest_name: name.trim(),
    guest_email: email.trim() || null,
    note: note.trim() || null,
  });

if (predictionError) {
  console.log("predictionError", predictionError);
  setSubmitError(
    predictionError.message || "Could not save prediction."
  );
  return;
}

const answerRows = questions.map((question) => ({
  prediction_id: predictionId,
  question_id: question.id,
  answer_value: answers[question.id],
}));

    const { error: answersError } = await supabase
      .from("answers")
      .insert(answerRows);

    if (answersError) {
  console.log("answersError", answersError);
  setSubmitError(
    answersError.message || "Could not save answers."
  );
  return;
}

    localStorage.setItem(`${slug}-submitted`, "true");
    setSubmitted(true);
    await loadPublicGuesses(eventRow.id);
  }

  if (loading) {
    return <main className="p-8">Loading…</main>;
  }

  if (!eventRow) {
    return <main className="p-8">Event not found.</main>;
  }

  return (
    <main className={`min-h-screen p-6 text-gray-900 ${colorClass(eventRow.accent)}`}>
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold">{eventRow.title}</h1>
          <p className="mt-2 text-gray-800">{eventRow.subtitle}</p>
        </section>

        {!submitted ? (
          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="mt-3 text-base text-gray-800">
  Submit your baby predictions below. After you send your answers, you’ll be
  able to see everyone else’s guesses. Your private message will stay hidden,
  and your email is only used if you want to be notified when the results are
  posted.
</p>
 <p className="mt-2 text-base text-gray-800">
    <strong>Please enter predicted birth weight in GRAMS and predicted birth length in CENTIMETERS. This makes it easier to graph the results, thanks!
  </strong></p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block font-medium">Your name</label>
                <input
                  className="w-full rounded-xl border p-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
  Email (optional, only if you want to be notified when results are posted)
</label>
                <input
                  className="w-full rounded-xl border p-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {questions.map((question) => (
                <div key={question.id}>
                  <label className="mb-2 block font-medium">
                    {question.label}
                  </label>

                  {question.question_type === "multiple_choice" ? (
                    <select
                      className="w-full rounded-xl border p-3"
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select one</option>
                      {(question.options || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={
                        question.question_type === "date"
                          ? "date"
                          : question.question_type === "time"
                          ? "time"
                          : "text"
                      }
                      className="w-full rounded-xl border p-3"
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="mb-2 block font-medium">
                  Message for the parents
                </label>
                <textarea
                  className="w-full rounded-xl border p-3"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {submitError ? (
                <p className="text-sm text-red-600">{submitError}</p>
              ) : null}

              <button
                type="submit"
                className="rounded-xl bg-black px-5 py-3 text-white"
              >
                Submit prediction
              </button>
            </form>
          </section>
        ) : (
  <>
  <ChartsSummary publicAnswers={publicAnswers} />
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold">Everyone’s guesses</h2>
      <p className="mt-2 text-gray-800">
        You can now see other submissions. Emails and private messages are
        hidden.
      </p>

      <div className="mt-6 space-y-4">
        {groupedGuesses.map((guess) => (
          <div key={guess.id} className="rounded-2xl border p-5">
            <h3 className="text-lg font-semibold">{guess.first_name}</h3>
            <div className="mt-3 space-y-2">
              {guess.answers.map((answer) => (
                <div key={answer.id} className="text-sm">
                  <span className="font-medium">
                    {answer.question_label}:
                  </span>{" "}
                  {answer.answer_value}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>

    
  </>
)}
      </div>
    </main>
  );
}
