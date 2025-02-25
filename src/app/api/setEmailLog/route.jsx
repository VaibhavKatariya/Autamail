import { NextResponse } from "next/server";
import { db } from "@/utils/firebaseAdmin"; // ✅ Use Firebase Admin SDK

export async function POST(req) {
    try {
        const { collectionName, docId, data } = await req.json();
        if (!collectionName || !data) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

        const docRef = docId ? db.collection(collectionName).doc(docId) : db.collection(collectionName).doc();
        await docRef.set(data, { merge: true });

        console.log(docRef.id);

        return NextResponse.json({ message: "Document added successfully", id: docRef.id }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const collectionName = searchParams.get("collectionName");
        const docId = searchParams.get("docId");

        if (!collectionName || !docId) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

        const docRef = db.collection(collectionName).doc(docId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) return NextResponse.json({ error: "Document not found" }, { status: 404 });

        return NextResponse.json({ id: docSnap.id, ...docSnap.data() }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const { collectionName, docId, data } = await req.json();
        if (!collectionName || !docId || !data) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

        const docRef = db.collection(collectionName).doc(docId);
        await docRef.update(data);

        return NextResponse.json({ message: "Document updated successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { collectionName, docId } = await req.json();
        if (!collectionName || !docId) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

        const docRef = db.collection(collectionName).doc(docId);
        await docRef.delete();

        return NextResponse.json({ message: "Document deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
