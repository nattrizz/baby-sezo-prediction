"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
} from "recharts";

type PublicAnswerRow = {
  id: string;
  event_id: string;
  prediction_id: string;
  question_label: string;
  answer_value: string;
  sort_order: number;
};
type SizePoint = {
  predictionId: string;
  length: number;
  weight: number;
};

export default function ChartsSummary({
  publicAnswers,
}: {
  publicAnswers: PublicAnswerRow[];
}) {
  const categoricalQuestions = [
    "Sex",
    "Blood type",
    "Will baby be born with hair?",
    "Who will baby look like more?",
    "Eye color",
    "If baby is a girl, first letter of the name",
    "If baby is a boy, first letter of the name",
  ];

  function makeCounts(questionLabel: string) {
    const filtered = publicAnswers.filter(
      (a) => a.question_label === questionLabel
    );

    const counts: Record<string, number> = {};

    for (const row of filtered) {
      counts[row.answer_value] = (counts[row.answer_value] || 0) + 1;
    }

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }
  const sizePoints: SizePoint[] = (() => {
    const lengthAnswers = publicAnswers.filter(
      (a) => a.question_label === "Predicted birth length (cm)"
    );
    const weightAnswers = publicAnswers.filter(
      (a) => a.question_label === "Predicted birth weight (grams)"
    );

    return lengthAnswers
      .map((lengthRow) => {
        const matchingWeight = weightAnswers.find(
          (w) => w.prediction_id === lengthRow.prediction_id
        );

        if (!matchingWeight) return null;

        const length = Number(lengthRow.answer_value);
        const weight = Number(matchingWeight.answer_value);

        if (Number.isNaN(length) || Number.isNaN(weight)) return null;

        return {
          predictionId: lengthRow.prediction_id,
          length,
          weight,
        };
      })
      .filter((point): point is SizePoint => point !== null);
  })();


  const girlNameSuggestions = publicAnswers
    .filter((a) => a.question_label === "Girl name suggestion")
    .map((a) => a.answer_value)
    .filter(Boolean);

  const boyNameSuggestions = publicAnswers
    .filter((a) => a.question_label === "Boy name suggestion")
    .map((a) => a.answer_value)
    .filter(Boolean);

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold">Community predictions overview</h2>
      <p className="mt-2 text-gray-800">
        A quick look at what everyone is guessing so far.
      </p>

      <div className="mt-8 space-y-10">
        <div>
          <h3 className="mb-3 text-lg font-semibold">
            Birth size guesses: length vs weight
          </h3>
          {sizePoints.length === 0 ? (
            <p className="text-sm text-gray-700">
              No birth size guesses yet.
            </p>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid />
                  <XAxis
                    type="number"
                    dataKey="length"
                    name="Length"
                    unit=" cm"
                  />
                  <YAxis
                    type="number"
                    dataKey="weight"
                    name="Weight"
                    unit=" g"
                  />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={sizePoints} fill="#4b5563" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {categoricalQuestions.map((question) => {
          const data = makeCounts(question);

          if (data.length === 0) return null;

          return (
            <div key={question}>
              <h3 className="mb-3 text-lg font-semibold">{question}</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4b5563" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}

        <div>
          <h3 className="mb-3 text-lg font-semibold">Girl name suggestions</h3>
          {girlNameSuggestions.length === 0 ? (
            <p className="text-sm text-gray-700">No girl name suggestions yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {girlNameSuggestions.map((name, index) => (
                <div
                  key={`girl-${name}-${index}`}
                  className="rounded-full border bg-gray-50 px-4 py-2 text-sm"
                >
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">Boy name suggestions</h3>
          {boyNameSuggestions.length === 0 ? (
            <p className="text-sm text-gray-700">No boy name suggestions yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {boyNameSuggestions.map((name, index) => (
                <div
                  key={`boy-${name}-${index}`}
                  className="rounded-full border bg-gray-50 px-4 py-2 text-sm"
                >
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}