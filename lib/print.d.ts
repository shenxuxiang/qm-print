import JSPDF from "jspdf";
type PDFOptions = {
    orientation?: 'p' | 'l' | 'portrait' | 'landscape';
    format?: 'a3' | 'a4' | 'a5';
    unit?: "pt" | "px" | "in" | "mm" | "cm" | "ex" | "em" | "pc";
};
type Html2CanvasOptions = {
    allowTaint: boolean;
    useCORS: boolean;
    scale: number;
    x: number;
    y: number;
};
export default class Printer {
    static pdfOptions: PDFOptions;
    static html2canvasOptions: Html2CanvasOptions;
    static size: {
        a3: number[];
        a4: number[];
        a5: number[];
    };
    pdf: JSPDF;
    paperWidth: number;
    paperHeight: number;
    safeAreaPaperWidth: number;
    safeAreaPaperHeight: number;
    safeAreaPadding: [number, number];
    ignoreTagNames: Set<string>;
    ignoreNodes: WeakSet<HTMLElement>;
    constructor(orientation?: PDFOptions['orientation'], format?: 'a3' | 'a4' | 'a5', padding?: number[]);
    addIgnoreNodes(node: HTMLElement): void;
    addIgnoreTagNames(tagName: string): void;
    validateNode(node: HTMLElement): boolean;
    indivisibleNode(node: HTMLElement): boolean;
    getOffsetTop(element: HTMLElement): number;
    computePagination(container: HTMLElement, limitHeight: number): number[];
    print(element: HTMLElement, printPageNumber?: boolean): Promise<boolean>;
}
export {};
