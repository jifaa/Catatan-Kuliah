import Database from "better-sqlite3";

const db = new Database("dev.db");

function generateId(prefix = "c") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

const scheduleSeed = [
  {
    title: "Sistem Informasi Geografis",
    aliases: ["Sistem Informasi Geografis"],
    dayOfWeek: 2,
    startTime: "10:40",
    endTime: "12:10",
    room: "GE-4.02 / R. Kuliah",
    className: "Internasional EE",
    lecturer: "ROFILDE HASUDUNGAN S.Kom., M.Sc",
  },
  {
    title: "Natural Language Processing",
    aliases: ["Natural Language Processing", "Natural Languange Processing"],
    dayOfWeek: 2,
    startTime: "07:20",
    endTime: "08:50",
    room: "GE-4.02 / R. Kuliah",
    className: "Internasional EE1",
    lecturer: "RUDIMAN S.Kom., M.Sc; NAUFAL AZMI VERDIKHA",
  },
  {
    title: "Komputer Grafik",
    aliases: ["Komputer Grafik"],
    dayOfWeek: 2,
    startTime: "09:00",
    endTime: "10:30",
    room: "GE-4.02 / R. Kuliah",
    className: "Internasional EE1",
    lecturer: "ABDUL RAHIM S.Kom., M.Cs.",
  },
  {
    title: "Metodologi Penelitian dan Publikasi Ilmiah",
    aliases: ["Metodologi Penelitian dan Publikasi Ilmiah", "Metode Penelitian"],
    dayOfWeek: 3,
    startTime: "10:40",
    endTime: "12:10",
    room: "GE-4.02 / R. Kuliah",
    className: "Internasional EE",
    lecturer: "ROFILDE HASUDUNGAN S.Kom., M.Sc",
  },
  {
    title: "Technopreneurship",
    aliases: ["Technopreneurship", "Technopreunership"],
    dayOfWeek: 5,
    startTime: "13:00",
    endTime: "14:30",
    room: "GE-4.02 / R. Kuliah",
    className: "Internasional EE",
    lecturer: "ROFILDE HASUDUNGAN S.Kom., M.Sc",
  },
  {
    title: "Visi Komputer",
    aliases: ["Visi Komputer"],
    dayOfWeek: 5,
    startTime: "10:40",
    endTime: "12:10",
    room: "GE-4.02 / R. Kuliah",
    className: "Internasional EE1",
    lecturer: "ABDUL RAHIM S.Kom., M.Cs.",
  },
  {
    title: "Keterampilan Hidup",
    aliases: ["Keterampilan Hidup"],
    dayOfWeek: 6,
    startTime: "15:00",
    endTime: "16:40",
    room: "Lapangan DD1",
    className: "Internasional EE1",
    lecturer: "NAUFAL AZMI VERDIKHA",
  },
];

const tx = db.transaction(() => {
  let semester = db
    .prepare('SELECT id FROM "Semester" WHERE name = ? LIMIT 1')
    .get("Semester 6");

  if (!semester) {
    const semesterId = generateId("sem");
    db.prepare(
      'INSERT INTO "Semester" (id, name, "startDate", "endDate", "order", "createdAt", "updatedAt") VALUES (?, ?, NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
    ).run(semesterId, "Semester 6");
    semester = { id: semesterId };
  }

  const selectedSubjects = [];

  for (const item of scheduleSeed) {
    const aliasPlaceholders = item.aliases.map(() => "?").join(",");
    const subject = db
      .prepare(
        `SELECT id, title FROM "Subject" WHERE "semesterId" = ? AND lower(title) IN (${aliasPlaceholders}) LIMIT 1`
      )
      .get(semester.id, ...item.aliases.map((alias) => alias.toLowerCase()));

    let subjectId;

    if (subject) {
      subjectId = subject.id;
      if (subject.title !== item.title) {
        db.prepare('UPDATE "Subject" SET title = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ?').run(
          item.title,
          subjectId
        );
      }
    } else {
      subjectId = generateId("sub");
      const maxOrderResult = db
        .prepare('SELECT MAX("order") AS maxOrder FROM "Subject" WHERE "semesterId" = ?')
        .get(semester.id);
      const nextOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

      db.prepare(
        'INSERT INTO "Subject" (id, title, description, "semesterId", "order", pinned, "createdAt", "updatedAt") VALUES (?, ?, NULL, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
      ).run(subjectId, item.title, semester.id, nextOrder);
    }

    selectedSubjects.push({
      ...item,
      subjectId,
    });
  }

  const subjectIds = selectedSubjects.map((item) => item.subjectId);
  const subjectPlaceholders = subjectIds.map(() => "?").join(",");

  db.prepare(`DELETE FROM "ClassSchedule" WHERE "subjectId" IN (${subjectPlaceholders})`).run(
    ...subjectIds
  );

  const insertStmt = db.prepare(
    'INSERT INTO "ClassSchedule" (id, "subjectId", "dayOfWeek", "startTime", "endTime", room, "className", lecturer, "order", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
  );

  selectedSubjects.forEach((item, index) => {
    insertStmt.run(
      generateId("sch"),
      item.subjectId,
      item.dayOfWeek,
      item.startTime,
      item.endTime,
      item.room,
      item.className,
      item.lecturer,
      index
    );
  });

  return {
    semesterId: semester.id,
    insertedSchedules: selectedSubjects.length,
  };
});

const result = tx();
console.log("Import jadwal Semester 6 selesai:", result);

db.close();
