import re, sys, json

def load_transcript(path):
    with open(path) as f:
        return f.read()

def split_sentences(text):
    return [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

ACTION_KW = ["will", "need", "plan", "should", "must", "tbd", "not sure"]
DECISION_KW = ["decided", "agreed", "approved", "selected", "chose", "resolved"]
OPEN_KW = ["not sure", "tbd", "unclear"]

def classify(sentences):
    result = {"action_items": [], "decisions": [], "open_questions":[]}
    for s in sentences:
        sl = s.lower()
        if any(kw in sl for kw in ACTION_KW):
            result["action_items"].append({"text":s})
        elif any(kw in sl for kw in DECISION_KW):
            result["decisions"].append({"text":s})
        elif any(kw in sl for kw in OPEN_KW):
            result["open_questions"].append({"text":s})
    return result

def write_summary(result, out_path = "summary.md"):
    with open(out_path,"w") as f:
        for section, items in result.items():
            f.write(f"## {section.replace('_', '')}\n")
            for item in items:
                f.write(f"- {item['text']}\n")


def main():
    print("Script started, loading: ", sys.argv[1])
    text = load_transcript(sys.argv[1])
    sentences = split_sentences(text)
    result = classify(sentences)
    write_summary(result)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()