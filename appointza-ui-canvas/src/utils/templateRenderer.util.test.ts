import { describe, expect, it } from "vitest";
import {
  applyConditionalSection,
  applyLoopSection,
  renderSiteTemplateHtml,
} from "@/utils/templateRenderer.util";

describe("template sections", () => {
  it("keeps or removes every occurrence of a conditional block", () => {
    const html = "A{{#x}}1{{/x}}B{{#x}}2{{/x}}C";
    expect(applyConditionalSection(html, "{{#x}}", "{{/x}}", true)).toBe("A1B2C");
    expect(applyConditionalSection(html, "{{#x}}", "{{/x}}", false)).toBe("ABC");
  });

  it("strips unmatched markers", () => {
    expect(applyConditionalSection("A{{#x}}B", "{{#x}}", "{{/x}}", true)).toBe("AB");
  });

  it("renders every occurrence of a loop", () => {
    const html = "<ul>{{#s}}<li>{{n}}</li>{{/s}}</ul><ol>{{#s}}<b>{{n}}</b>{{/s}}</ol>";
    const out = applyLoopSection(html, "{{#s}}", "{{/s}}", [{ n: "a" }, { n: "b" }], (tpl, item) =>
      tpl.replaceAll("{{n}}", item.n),
    );
    expect(out).toBe("<ul><li>a</li><li>b</li></ul><ol><b>a</b><b>b</b></ol>");
  });

  it("removes a loop when there are no items", () => {
    expect(applyLoopSection("x{{#s}}y{{/s}}z", "{{#s}}", "{{/s}}", [], (t) => t)).toBe("xz");
  });
});

/** The renderer appends the booking-nav `<script>`; assertions only care about the body. */
const render = (tpl: string, site: never) => renderSiteTemplateHtml(tpl, site).split("\n<script>")[0];

describe("renderSiteTemplateHtml", () => {
  const baseSite = {
    organisationdetail: { id: 26, name: "Wonder", gstnumber: "33ABCDE1234F1Z5" },
    locationdetail: { id: 29, organisationid: 26, name: "Main", email: "hi@wonder.in" },
  } as never;

  it("fills GST and email tokens, including legacy spellings", () => {
    const tpl =
      "{{organisationdetail.name}}|{{organisationgstnumber}}|{{#gstnumber}}GST {{gstnumber}}{{/gstnumber}}|" +
      "{{#organizationemail}}{{organizationemail}}{{/organizationemail}}";
    expect(render(tpl, baseSite)).toBe(
      "Wonder|33ABCDE1234F1Z5|GST 33ABCDE1234F1Z5|hi@wonder.in",
    );
  });

  it("hides GST and email blocks when empty", () => {
    const site = {
      organisationdetail: { id: 26, name: "Wonder", gstnumber: "" },
      locationdetail: { id: 29, organisationid: 26, name: "Main" },
    } as never;
    const tpl = "[{{#gstnumber}}GST{{/gstnumber}}][{{#organisationemail}}mail{{/organisationemail}}]";
    expect(render(tpl, site)).toBe("[][]");
  });

  it("hides reviews and facilities when the payload has none", () => {
    const tpl =
      "{{#hasreviews}}R{{#reviews}}{{comment}}{{/reviews}}{{/hasreviews}}" +
      "{{#hasfacilities}}F{{#facilities}}{{facility_displaytext}}{{/facilities}}{{/hasfacilities}}end";
    expect(render(tpl, baseSite)).toBe("end");
  });
});
