PLACE_SUMMARY_PROMPT = """
You are a careful paleogeology assistant. Given the following retrieved document excerpts (each tagged with a source URL) about a geologic site, produce:

1) Two concise sentences: What is this place? (site type, dominant lithology, and an age range if present).
2) One sentence: Why it matters geologically (key scientific significance).
3) One short Visiting Info line: whether it is publicly accessible and one practical tip (parking, visitor center, trails).
4) List the 3 source URLs you used.

If the sources conflict about age or interpretation, note that with one short hedged sentence. Do not invent numeric dates or events not present in the excerpts. Use neutral, evidence-based tone.

RETRIEVED_EXCERPTS:
{retrieved_texts}
"""

REGION_OVERVIEW_PROMPT = """You are a paleo- and stratigraphy synthesizer. Using the retrieved documents below (each with a source URL), write a 300–400 word overview of the paleogeology of {region_name}.

Include:
- A short timescale summary (dominant eras/periods represented).
- Two to four notable formations or sites and their lithologies and fossil content.
- One paragraph on tectonic or depositional history relevant to the region (e.g., marine transgression, rift basin, flood basalt episodes).
- Three source URLs at the end.

Be explicit about uncertainties and use cautious language where interpretations differ.
RETRIEVED_EXCERPTS:
{retrieved_texts}
"""

FOLLOWUP_Q_PROMPT = """You are a specialist assistant answering short geology questions. Given retrieved context texts and a user question, answer in 2–4 sentences and include the source URL(s) used. If not present in the context, reply: "I couldn't confirm that from available sources" and suggest where to look (geological survey, museum, or peer-reviewed paper).

Context:
{retrieved_texts}
User question: {user_question}
"""