import fitz
from collections import defaultdict
from pathlib import Path


SOURCE_PDF = Path(r"C:/Users/49808/Downloads/Power Up S 木棍体_替换词汇.pdf")
OUTPUT_PDF = Path(r"C:/Users/49808/Downloads/Power Up S 木棍体_替换词汇_已替换.pdf")
FONT_PATH = Path(r"C:/Windows/Fonts/LHANDW.TTF")

REPLACEMENTS = {
    "one": "pencil",
    "two": "chair",
    "three": "bag",
    "four": "rubber",
    "five": "book",
    "six": "desk",
}

BASE_FONT_SIZE = 24
TOP_FIRST_COLOR = (1, 0, 0)
TOP_OTHER_COLOR = (0.651, 0.651, 0.651)
BOTTOM_COLOR = (0, 0, 0)


def replace_words() -> None:
    doc = fitz.open(SOURCE_PDF)
    font = fitz.Font(fontfile=str(FONT_PATH))

    for page_index in (0, 1):
        page = doc[page_index]
        words = page.get_text("words")
        insert_ops = []

        for old_word, new_word in REPLACEMENTS.items():
            occurrences = [word for word in words if word[4].lower() == old_word]
            if not occurrences:
                continue

            bands = defaultdict(list)
            for occurrence in occurrences:
                bands[round(occurrence[1], 1)].append(occurrence)

            bottom_band = max(bands)

            for band_y, items in bands.items():
                items = sorted(items, key=lambda item: item[0])
                is_bottom_line = len(bands) > 1 and band_y == bottom_band

                for index, (x0, y0, x1, y1, *_rest) in enumerate(items):
                    page.add_redact_annot(
                        fitz.Rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1),
                        fill=(1, 1, 1),
                    )

                    if is_bottom_line:
                        color = BOTTOM_COLOR
                    else:
                        color = TOP_FIRST_COLOR if index == 0 else TOP_OTHER_COLOR

                    if index < len(items) - 1:
                        next_x0 = items[index + 1][0]
                        available_width = next_x0 - x0 - 4
                    else:
                        available_width = page.rect.width - x0 - 10

                    available_width = max(available_width, x1 - x0 + 4)
                    base_width = font.text_length(new_word, fontsize=BASE_FONT_SIZE)
                    font_size = min(
                        BASE_FONT_SIZE,
                        BASE_FONT_SIZE * (available_width - 2) / base_width,
                    )
                    font_size = max(14, font_size)

                    # Use a baseline offset instead of a textbox to avoid clipping.
                    baseline_y = y1 - max(6, font_size * 0.3)
                    insert_ops.append((x0, baseline_y, new_word, font_size, color))

        page.apply_redactions(images=0, graphics=0)

        for x, y, text, font_size, color in insert_ops:
            page.insert_text(
                (x, y),
                text,
                fontsize=font_size,
                fontfile=str(FONT_PATH),
                color=color,
                overlay=True,
            )

    doc.save(OUTPUT_PDF)


if __name__ == "__main__":
    replace_words()
