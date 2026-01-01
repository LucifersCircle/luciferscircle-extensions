import { Request } from "@paperback/types";
import { checkCloudflareStatus } from "./network";

export async function fetchJSON<T>(request: Request): Promise<T> {
    console.log(`[QiScans] fetchJSON: Fetching ${request.url}`);

    const [response, buffer] = await Application.scheduleRequest(request);

    console.log(`[QiScans] fetchJSON: Got response status ${response.status}`);

    checkCloudflareStatus(request, response.status);

    if (response.status !== 200) {
        throw new Error(
            `[QiScans] Request failed with status ${response.status}: ${request.url}`,
        );
    }

    const data = Application.arrayBufferToUTF8String(buffer);
    console.log(`[QiScans] fetchJSON: Data length: ${data.length} chars`);
    console.log(
        `[QiScans] fetchJSON: First 200 chars: ${data.substring(0, 200)}`,
    );

    try {
        const json: T =
            typeof data === "string" ? (JSON.parse(data) as T) : (data as T);

        console.log(`[QiScans] fetchJSON: Successfully parsed JSON`);
        console.log(`[QiScans] fetchJSON: JSON type: ${typeof json}`);
        console.log(`[QiScans] fetchJSON: JSON is null: ${json === null}`);

        return json;
    } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : String(error);

        throw new Error(
            `[QiScans] Failed to parse JSON from ${request.url}: ${reason}`,
        );
    }
}

export async function fetchText(request: Request): Promise<string> {
    const [response, buffer] = await Application.scheduleRequest(request);

    checkCloudflareStatus(request, response.status);

    const data = Application.arrayBufferToUTF8String(buffer);

    if (response.status !== 200) {
        console.log(
            `[QiScans] Non-200 status while fetching text: ${request.url} (status=${response.status})`,
        );
    }

    return typeof data === "string" ? data : String(data);
}

export async function fetchImage(request: Request): Promise<ArrayBuffer> {
    const [response, buffer] = await Application.scheduleRequest(request);

    checkCloudflareStatus(request, response.status);

    if (response.status !== 200) {
        throw new Error(
            `[QiScans] Request failed with status ${response.status}: ${request.url}`,
        );
    }

    return buffer;
}
