import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const collocations = JSON.parse(fs.readFileSync(path.join(root, "data/approved_collocations.seed.json"), "utf8"));
const cards = JSON.parse(fs.readFileSync(path.join(root, "data/approved_cards.seed.json"), "utf8"));
const candidatePath = path.join(root, "data/collocation_use_prompt_candidates.json");
const existingBatch = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
const existingById = new Map(existingBatch.items
  .filter((item) => item.review_status === "approved")
  .map((item) => [item.collocation_id, item]));

const createdEvent = {
  action: "created",
  reviewer: "codex",
  reason: "根据已审核搭配与迁移训练规范生成换场景中译英候选，等待人工审核。",
  reviewed_at: "2026-08-18T17:15:00+08:00",
};
const withReviewHistory = (item) => {
  if (item.review_history?.length) return item;
  const review_history = [createdEvent];
  if (item.review_status === "approved") review_history.push({
    action: "approved",
    reviewer: "local_user",
    reason: "用户审核首批搭配应用题后确认可以发布。",
    reviewed_at: "2026-08-18T10:00:00.000Z",
  });
  return { ...item, review_history };
};

const m = (canonical, prompt, answer, targetSurface = canonical, hints = []) => ({
  canonical,
  prompt,
  answer,
  targetSurface,
  hints,
});

const manualRows = [
  m("a positive relationship between", "研究发现，公共信任与人们遵守环境法规之间存在正向关系。", "The study found a positive relationship between public trust and compliance with environmental regulations."),
  m("a preferred area of study", "学生应当能够根据自己的兴趣选择偏好的学习领域。", "Students should be able to choose a preferred area of study according to their interests."),
  m("a productive member of society", "良好的教育可以帮助年轻人成为对社会有贡献的一员。", "A good education can help a young person become a productive member of society."),
  m("a productive working life", "终身学习有助于人们保持富有成效的职业生涯。", "Lifelong learning helps people maintain a productive working life."),
  m("a proportion of profits", "大型企业可以把一定比例的利润投入员工培训。", "Large companies could invest a proportion of profits in employee training."),
  m("a range of measures", "政府需要采取一系列措施来降低青年失业率。", "The government needs to adopt a range of measures to reduce youth unemployment."),
  m("a reliable alternative to", "在偏远地区，远程医疗可以成为面对面问诊的可靠替代方案。", "In remote areas, telemedicine can provide a reliable alternative to face-to-face consultations."),
  m("a rich variety of", "多元文化城市通常能为居民提供种类丰富的食物和艺术活动。", "Multicultural cities usually offer residents a rich variety of food and artistic activities."),
  m("a sedentary lifestyle", "长时间远程办公可能使员工形成久坐的生活方式。", "Long hours of remote work may encourage employees to adopt a sedentary lifestyle."),
  m("a sense of community", "公共图书馆可以在城市社区中培养归属感。", "Public libraries can create a sense of community in urban neighbourhoods."),
  m("a sense of purpose in life", "参与志愿服务可以让退休人员获得生活的目标感。", "Taking part in voluntary work can give retired people a sense of purpose in life."),
  m("a shortsighted view", "只关注项目的初始成本是一种目光短浅的观点。", "Focusing only on the initial cost of the project is a shortsighted view."),
  m("a successful career", "沟通能力和专业知识都有助于毕业生建立成功的职业生涯。", "Communication skills and professional knowledge can both help graduates build a successful career."),
  m("a waste of resources", "在没有明确需求的地区修建空置机场是对公共资源的浪费。", "Building an unused airport in an area with no clear demand is a waste of resources."),
  m("absorb carbon dioxide", "健康的森林可以吸收二氧化碳并减缓气候变化。", "Healthy forests absorb carbon dioxide and slow climate change."),
  m("academic qualifications", "一些职位需要学历，但实际经验同样重要。", "Some positions require academic qualifications, but practical experience is equally important."),
  m("according to one's qualifications", "申请人应当根据自己的资历获得不同层级的培训机会。", "Applicants should receive different levels of training according to their qualifications.", "according to their qualifications"),
  m("achieve good grades", "稳定的学习习惯比考前突击更能帮助学生取得好成绩。", "Consistent study habits are more likely than last-minute revision to help students achieve good grades."),
  m("address environmental problems", "城市可以通过改善公共交通来应对环境问题。", "Cities can address environmental problems by improving public transport."),
  m("affordable housing", "快速发展的城市必须为低收入劳动者提供更多可负担住房。", "Fast-growing cities must provide more affordable housing for low-income workers."),
  m("against one's will", "任何人都不应违背自己的意愿被迫选择某种职业。", "No one should be forced to choose a particular career against their will.", "against their will"),
  m("aim for equal proportions", "招聘委员会不应机械地追求男女比例完全相等。", "Recruitment panels should not mechanically aim for equal proportions of men and women."),
  m("alternative sources of financial support", "小型博物馆可以寻找其他资金支持来源，而不是完全依赖门票收入。", "Small museums can seek alternative sources of financial support rather than relying entirely on ticket sales."),
  m("an improved quality of life", "更安全的街道和更清洁的空气可以给城市居民带来改善后的生活质量。", "Safer streets and cleaner air can provide city residents with an improved quality of life."),
  m("arouse emotions", "真实的灾难幸存者故事往往比统计数字更能唤起情感。", "Personal stories from disaster survivors are more likely than statistics to arouse emotions."),
  m("base admission on", "大学不应只把录取建立在考试成绩的基础上。", "Universities should not base admission on examination results alone."),
  m("be applicable to", "同一项交通政策未必适用于每一座城市。", "The same transport policy may not be applicable to every city."),
  m("be better spent on", "这笔公共资金更适合用于教师培训，而不是广告宣传。", "This public money would be better spent on teacher training rather than advertising."),
  m("be charged more than", "游客不应被收取高于当地居民的公共交通费用。", "Tourists should not be charged more than local residents for public transport."),
  m("be cleared for human use", "任何新药在获准供人类使用之前都必须经过严格测试。", "Any new medicine must be rigorously tested before it can be cleared for human use."),
  m("be faced with rising costs", "许多小企业正面临不断上涨的能源和租金成本。", "Many small businesses are faced with rising costs for energy and rent.", "are faced with rising costs"),
  m("be funded by government subsidies", "偏远地区的公交线路可能需要由政府补贴资助。", "Bus services in remote areas may need to be funded by government subsidies."),
  m("be given more importance than", "公共安全不应比基本个人自由受到更多重视。", "Public safety should not automatically be given more importance than basic individual freedom."),
  m("be highly addictive", "带有随机奖励的手机游戏可能极易使儿童上瘾。", "Mobile games with random rewards can be highly addictive for children."),
  m("be in conflict with", "无限制的数据收集可能与个人隐私权相冲突。", "Unrestricted data collection may be in conflict with the right to personal privacy."),
  m("be in good financial health", "只有财务状况良好的公司才应承诺长期扩张。", "Only companies that are in good financial health should commit to long-term expansion.", "in good financial health"),
  m("be incompatible with the needs of", "固定的办公时间可能与有照护责任员工的需求不相容。", "Rigid office hours may be incompatible with the needs of employees who have caring responsibilities."),
  m("be less widely spoken", "一些少数民族语言正在年轻一代中变得使用范围较小。", "Some minority languages are becoming less widely spoken among younger generations.", "less widely spoken"),
  m("be linked in part to", "城市空气质量下降被认为在一定程度上与交通量增加有关。", "The decline in urban air quality is believed to be linked in part to heavier traffic."),
  m("be outweighed by the drawbacks", "远程办公带来的便利可能被长期社会隔离的缺点所抵消。", "The convenience of remote work may be outweighed by the drawbacks of long-term social isolation."),
  m("be passionate about", "学生更可能在自己真正充满热情的领域坚持学习。", "Students are more likely to persist in a field that they are passionate about.", "passionate about"),
  m("be relevant to", "乡村地区的交通方案必须与当地居民的实际需求相关。", "Transport plans for rural areas must be relevant to the practical needs of local residents."),
  m("be spent on", "更多税收收入应当被用于预防性医疗服务。", "More tax revenue should be spent on preventive healthcare services."),
  m("become competent at", "学生需要反复练习才能逐渐熟练掌握学术写作。", "Students need repeated practice to become competent at academic writing."),
  m("become involved in crime", "缺乏稳定工作可能增加年轻人卷入犯罪的风险。", "A lack of stable employment may increase the risk that young people become involved in crime."),
  m("beneficial and detrimental effects on", "国际旅游对当地社区既有有利影响，也有不利影响。", "International tourism can have both beneficial and detrimental effects on local communities."),
  m("break the law", "经济困难不能成为企业违法排污的借口。", "Financial difficulty cannot excuse a company that chooses to break the law."),
  m("career progression", "透明的晋升标准可以改善员工的职业发展。", "Transparent promotion criteria can improve employees' career progression."),
  m("choose a career path", "年轻人选择职业道路时应考虑兴趣和就业前景。", "Young people should consider both their interests and employment prospects when they choose a career path."),
  m("consider something from the opposite angle", "在否定居家办公之前，管理者也应从相反角度看待这一政策。", "Before rejecting remote work, managers should consider the policy from the opposite angle.", "consider the policy from the opposite angle"),
  m("continue one's studies", "经济援助可以让低收入学生继续学业。", "Financial support can enable low-income students to continue their studies.", "continue their studies"),
  m("contribute something positive to society", "社区志愿者能够通过照顾独居老人为社会作出积极贡献。", "Community volunteers can contribute something positive to society by supporting older people who live alone."),
  m("cover running costs", "门票收入不足以支付小型剧院的日常运营成本。", "Ticket revenue is not sufficient to cover running costs for a small theatre."),
  m("create new possibilities for", "高速网络可以为偏远地区的远程教育创造新的可能。", "High-speed internet can create new possibilities for distance learning in remote areas."),
  m("curb the traffic problem", "提高市中心停车费本身不足以遏制交通拥堵问题。", "Raising parking charges in city centres is not sufficient to curb the traffic problem."),
  m("cut costs related to", "数字化档案可以削减与纸质行政工作相关的成本。", "Digital records can cut costs related to paper-based administration."),
  m("depend on state subsidies", "一些偏远铁路线路仍然依赖政府补贴才能运营。", "Some remote railway lines still depend on state subsidies to operate."),
  m("depend on support from", "社区食物银行通常依赖当地企业和志愿者的支持。", "Community food banks often depend on support from local businesses and volunteers."),
  m("deter someone from doing something", "高额罚款可以阻止企业向河流排放有毒废物。", "Heavy fines can deter companies from dumping toxic waste into rivers.", "deter companies from dumping toxic waste"),
  m("discourage real interaction", "过度依赖在线会议可能阻碍同事之间的真实互动。", "Excessive reliance on online meetings may discourage real interaction between colleagues."),
  m("dismiss something as irrelevant", "决策者不应把当地居民的担忧斥为无关紧要。", "Policy makers should not dismiss local residents' concerns as irrelevant.", "dismiss local residents' concerns as irrelevant"),
  m("do everything one can to", "地方政府应尽己所能保护城市周边的湿地。", "Local governments should do everything they can to protect wetlands around cities.", "do everything they can to"),
  m("dominate the market", "少数大型科技公司不应被允许主导数字广告市场。", "A small number of technology companies should not be allowed to dominate the digital advertising market.", "dominate the digital advertising market"),
  m("encourage the extinction of", "忽视少数民族语言会助长这些语言的灭绝。", "Neglecting minority languages may encourage the extinction of these languages."),
  m("enhance quality of life", "无障碍公共空间可以提升残障人士的生活质量。", "Accessible public spaces can enhance the quality of life for people with disabilities.", "enhance the quality of life"),
  m("ensure the survival of", "限制非法捕猎对于确保濒危物种的生存至关重要。", "Restricting illegal hunting is essential to ensure the survival of endangered species."),
  m("equal educational opportunities", "农村儿童和城市儿童都应当享有平等的受教育机会。", "Children in rural and urban areas should all have equal educational opportunities."),
  m("ethical arguments against", "反对未经同意使用个人医疗数据存在有力的伦理论据。", "There are strong ethical arguments against using personal medical data without consent."),
  m("exist side by side with", "传统商店可以与电子商务平台共存。", "Traditional shops can exist side by side with e-commerce platforms."),
  m("for the benefit of", "城市规划应当为了整个社区的利益，而不是少数开发商的利益。", "Urban planning should be carried out for the benefit of the whole community rather than a small number of developers."),
  m("fulfil basic needs", "公共政策首先应确保每个家庭都能满足基本需求。", "Public policy should first ensure that every household can fulfil basic needs."),
  m("future prosperity", "投资儿童教育对于国家未来的繁荣至关重要。", "Investment in children's education is essential for a country's future prosperity."),
  m("gain real experience", "实习可以让大学生在毕业前获得真实工作经验。", "Internships allow university students to gain real experience before graduation."),
  m("global appeal", "流媒体平台帮助本地音乐获得全球吸引力。", "Streaming platforms can help local music develop global appeal."),
  m("go against the values of", "歧视性的招聘制度违背公平社会的价值观。", "Discriminatory recruitment systems go against the values of a fair society."),
  m("good manners", "学校和家庭都应教孩子养成良好的礼貌修养。", "Both schools and families should teach children good manners."),
  m("government support for", "政府对清洁能源初创企业的支持可以加快技术创新。", "Government support for clean-energy start-ups can accelerate technological innovation."),
  m("have a huge budget for", "一些城市为大型体育场投入巨额预算，却忽视基本公共服务。", "Some cities have a huge budget for major stadiums while neglecting basic public services."),
  m("have a role to play in", "消费者在减少一次性塑料使用方面也可以发挥作用。", "Consumers also have a role to play in reducing the use of single-use plastics."),
  m("have an impact on", "工作时间过长会对员工的家庭关系造成影响。", "Excessively long working hours can have an impact on employees' family relationships."),
  m("have an influence on", "社交媒体上的广告会对年轻消费者的选择产生影响。", "Advertising on social media can have an influence on the choices of young consumers."),
  m("have negative consequences", "取消乡村公交服务会给老年居民带来负面后果。", "Removing rural bus services can have negative consequences for older residents."),
  m("have something to gain from", "地方政府能从与居民进行公开协商中获益。", "Local governments have something to gain from consulting residents openly."),
  m("have the freedom to", "成年人应有自由选择自己的生活方式。", "Adults should have the freedom to choose their own way of life."),
  m("have the right to", "所有儿童都有权获得安全且优质的教育。", "All children have the right to receive a safe and high-quality education."),
  m("implement a range of measures", "城市需要实施一系列措施来改善空气质量。", "Cities need to implement a range of measures to improve air quality."),
  m("impose taxes on", "政府可以对污染严重的行业征税。", "Governments can impose taxes on heavily polluting industries."),
  m("improve motor skills", "户外游戏可以帮助幼儿提升动作技能。", "Outdoor games can help young children improve motor skills."),
  m("in a variety of ways", "数字技术能够以多种方式改善公共服务。", "Digital technology can improve public services in a variety of ways."),
  m("increase the retirement age", "在人口预期寿命上升的国家，提高退休年龄可能是必要的。", "It may be necessary to increase the retirement age in countries where life expectancy is rising."),
  m("introduce road safety measures", "地方政府应在学校周边推行更严格的道路安全措施。", "Local authorities should introduce stricter road safety measures around schools.", "introduce stricter road safety measures"),
  m("invest in improvements and innovations", "公共交通运营商必须投资改进与创新，才能吸引更多乘客。", "Public transport operators must invest in improvements and innovations to attract more passengers."),
  m("knowledge and skill gaps", "短期职业培训可以帮助失业者弥补知识与技能缺口。", "Short vocational courses can help unemployed people close knowledge and skill gaps."),
  m("learn practical skills", "学生可以通过社区项目学习实用技能。", "Students can learn practical skills through community projects."),
  m("limit emissions from", "更严格的法规可以限制来自燃煤电站的排放。", "Stricter regulations can limit emissions from coal-fired power stations."),
  m("live in complete isolation", "远程工作者不应因为缺少线下活动而完全与世隔绝地生活。", "Remote workers should not have to live in complete isolation because of a lack of offline activities."),
  m("maintain the natural balance", "保护捕食者有助于维持森林生态系统的自然平衡。", "Protecting predators helps maintain the natural balance of forest ecosystems."),
  m("major drawbacks of", "通勤时间长是郊区生活的主要弊端之一。", "Long commuting times are among the major drawbacks of suburban living."),
  m("make a huge difference to", "可靠的托儿服务会对低收入父母的就业前景产生巨大影响。", "Reliable childcare can make a huge difference to the employment prospects of low-income parents."),
  m("make a positive contribution to society", "退休专业人士可以通过指导年轻人继续为社会作出积极贡献。", "Retired professionals can continue to make a positive contribution to society by mentoring young people."),
  m("make a profit", "企业有权赚取利润，但也必须遵守环境法规。", "Companies are entitled to make a profit, but they must also follow environmental regulations."),
  m("make every effort to", "医院应尽一切努力保护患者的个人数据。", "Hospitals should make every effort to protect patients' personal data."),
  m("make more effort to", "大型雇主应更加努力地招聘残障人士。", "Large employers should make more effort to recruit people with disabilities."),
  m("make one's own choices", "年轻人需要空间来自己作出教育和职业选择。", "Young people need room to make their own choices about education and work.", "make their own choices"),
  m("measure the effectiveness of", "政府应利用公开数据衡量新住房政策的有效性。", "Governments should use public data to measure the effectiveness of the new housing policy."),
  m("meet one's basic needs", "最低工资应足以让劳动者满足自己的基本生活需要。", "The minimum wage should be sufficient for workers to meet their basic needs.", "meet their basic needs"),
  m("meet the changing needs of", "大学课程必须不断调整，以满足劳动力市场不断变化的需求。", "University courses must adapt to meet the changing needs of the labour market."),
  m("on a volunteer basis", "许多社区体育俱乐部依靠人们以志愿方式管理。", "Many community sports clubs are managed by people on a volunteer basis."),
  m("on an individual level", "从个人层面看，减少食物浪费可以从更合理的购物开始。", "On an individual level, reducing food waste can begin with more careful shopping."),
  m("pay a deposit", "租客通常必须在搬入公寓之前支付定金。", "Tenants usually have to pay a deposit before moving into an apartment."),
  m("pay a living wage", "接受公共合同的企业应当向所有员工支付维持生活的工资。", "Companies receiving public contracts should pay a living wage to all employees."),
  m("pay a mortgage", "房价上涨使许多年轻家庭难以偿还房贷。", "Rising house prices make it difficult for many young families to pay a mortgage."),
  m("pay attention to", "道路设计者必须注意行人和骑行者的安全。", "Road designers must pay attention to the safety of pedestrians and cyclists."),
  m("place importance on", "公司应重视员工福祉，而不只是短期利润。", "Companies should place importance on employee wellbeing rather than short-term profit alone."),
  m("play an important role in", "地方媒体在监督公共支出方面发挥重要作用。", "Local media play an important role in monitoring public spending."),
  m("play one's part in", "普通居民可以通过分类垃圾在保护环境方面尽自己的一份力。", "Ordinary residents can play their part in protecting the environment by sorting household waste.", "play their part in"),
  m("prepare someone for real-world tasks", "项目式学习可以使学生为现实任务做好准备。", "Project-based learning can prepare students for real-world tasks.", "prepare students for real-world tasks"),
  m("present a challenge", "人口快速老龄化将给乡村医疗服务构成重大挑战。", "Rapid population ageing will present a considerable challenge for rural healthcare services.", "present a considerable challenge"),
  m("preserve traditions and customs", "地方节庆可以帮助年轻一代保护传统与习俗。", "Local festivals can help younger generations preserve traditions and customs."),
  m("professional achievements", "招聘决定不应只看候选人的职业成就。", "Recruitment decisions should not be based solely on candidates' professional achievements."),
  m("progress through the levels of", "学员只有掌握基础技能后才能逐级通过培训课程。", "Trainees can progress through the levels of the training programme only after mastering the basic skills."),
  m("promote better driving habits", "持续的道路教育可以促进更好的驾驶习惯。", "Ongoing road education can promote better driving habits."),
  m("promote local film-making", "有针对性的资助可以推动本地电影制作。", "Targeted funding can promote local film-making."),
  m("pursue a university degree", "并非每个离校生都需要攻读大学学位。", "Not every school leaver needs to pursue a university degree."),
  m("push up property prices", "短期出租需求可能推高旅游城市的房价。", "Demand for short-term rentals may push up property prices in tourist cities."),
  m("put emphasis on", "职业课程应把更多重点放在可迁移的实用技能上。", "Vocational courses should put more emphasis on transferable practical skills.", "put more emphasis on"),
  m("raise a family", "缺乏可负担托儿服务会使年轻人更难养育家庭。", "A lack of affordable childcare makes it harder for young adults to raise a family."),
  m("reach one's potential", "来自教师的个别支持可以帮助每个孩子发挥自身潜能。", "Individual support from teachers can help every child reach their potential.", "reach their potential"),
  m("reduce pressure on", "发展区域就业中心可以减轻大城市的住房压力。", "Developing regional employment centres can reduce pressure on housing in major cities."),
  m("rely on someone for help", "老年人不应只能依靠家人获得日常帮助。", "Older people should not have to rely on family members for help with daily tasks.", "rely on family members for help"),
  m("require little equipment", "步行和慢跑几乎不需要设备，因此多数人都能参与。", "Walking and jogging require little equipment and are therefore accessible to most people."),
  m("result in greater demand for", "人口增长会导致对可负担住房的更大需求。", "Population growth will result in greater demand for affordable housing."),
  m("rich cultural diversity", "移民能够给大城市带来丰富的文化多样性。", "Immigration can bring rich cultural diversity to large cities."),
  m("serve a prison sentence", "犯下严重暴力罪行的人可能需要服刑。", "People who commit serious violent offences may need to serve a prison sentence."),
  m("share common interests", "社区活动让拥有共同兴趣的居民相互认识。", "Community activities allow residents who share common interests to get to know one another."),
  m("social obligations", "企业的社会责任不应止于依法纳税。", "A company's social obligations should extend beyond paying the taxes required by law."),
  m("society as a whole", "提高基础识字率会使整个社会受益。", "Improving basic literacy benefits society as a whole."),
  m("straight after school", "并非所有年轻人都应当中学毕业后立即进入大学。", "Not all young people should enter university straight after school."),
  m("subject someone to trauma", "不必要的重复问询可能使犯罪受害者再次遭受创伤。", "Unnecessary repeated questioning may subject crime victims to further trauma.", "subject crime victims to further trauma"),
  m("suffer in comparison", "资金不足的乡村学校与城市学校相比往往显得逊色。", "Poorly funded rural schools often suffer in comparison with urban schools."),
  m("take measures to tackle", "政府必须采取措施处理不断扩大的住房短缺。", "Governments must take measures to tackle the growing housing shortage."),
  m("take pleasure in", "孩子更可能坚持自己能从中获得乐趣的运动。", "Children are more likely to continue with sports that they take pleasure in."),
  m("take pride in", "员工如果能为工作质量感到自豪，通常会更投入。", "Employees are often more engaged when they can take pride in the quality of their work."),
  m("take public transport", "更便宜且可靠的服务会鼓励更多通勤者乘坐公共交通。", "Cheaper and more reliable services would encourage more commuters to take public transport."),
  m("take steps to reduce", "超市可以采取措施减少不必要的塑料包装。", "Supermarkets can take steps to reduce unnecessary plastic packaging."),
  m("take steps to tackle", "大学必须采取措施解决毕业生的技能短缺问题。", "Universities must take steps to tackle skills shortages among graduates."),
  m("the cost of living", "生活成本上升正在迫使更多家庭削减非必要支出。", "The rising cost of living is forcing more families to reduce non-essential spending.", "cost of living"),
  m("the developed world", "电子垃圾已经成为发达国家和地区的严重问题。", "Electronic waste has become a serious problem across the developed world."),
  m("the key consideration", "设计学校课程时，儿童的长期发展应是首要考虑因素。", "Children's long-term development should be the key consideration when school curricula are designed."),
  m("the odds are stacked in favour of", "在缺乏透明规则的情况下，成功机会往往偏向有关系的申请者。", "Without transparent rules, the odds are stacked in favour of applicants with personal connections."),
  m("the trend towards", "向无现金支付发展的趋势可能把部分老年人排除在外。", "The trend towards cashless payments may exclude some older people."),
  m("those in need", "社会福利制度应把有限资源优先提供给需要帮助的人。", "Welfare systems should direct limited resources towards those in need."),
  m("throughout one's life", "人们需要贯穿一生不断更新数字技能。", "People need to update their digital skills throughout their lives.", "throughout their lives"),
  m("traditional roles", "灵活就业正在改变家庭内部的传统角色分工。", "Flexible employment is changing traditional roles within families."),
  m("treat someone with respect", "公共服务人员必须尊重地对待每一位居民。", "Public service workers must treat every resident with respect.", "treat every resident with respect"),
  m("turn one's life around", "稳定的住房和职业培训可以帮助前囚犯彻底改变人生。", "Stable housing and vocational training can help former prisoners turn their lives around.", "turn their lives around"),
  m("use accounting loopholes", "跨国公司不应利用会计漏洞来逃避合理税款。", "Multinational companies should not use accounting loopholes to avoid a fair level of tax."),
  m("value one thing above another", "公共政策不应把短期经济增长看得比环境安全更重要。", "Public policy should not value short-term economic growth above environmental security.", "value short-term economic growth above environmental security"),
  m("waste an opportunity", "如果政府忽视公众反馈，就会浪费一次改进政策的机会。", "If the government ignores public feedback, it will waste an opportunity to improve the policy."),
  m("with regard to", "就公共支出而言，透明度应当是所有部门的基本要求。", "With regard to public spending, transparency should be a basic requirement for every department."),
  m("take no interest in", "一些青少年对地方政治毫无兴趣，因此很少参加社区会议。", "Some teenagers take no interest in local politics and therefore rarely attend community meetings.", "take no interest in", [
    { zh: "地方政治", en: "local politics" },
    { zh: "社区会议", en: "community meetings" },
  ]),
  m("cannot have failed to notice", "经常乘坐公共交通的通勤者，不可能没有注意到近几个月票价的上涨。", "Commuters who regularly use public transport cannot have failed to notice the rise in fares over recent months.", "cannot have failed to notice", [
    { zh: "通勤者", en: "commuters" },
    { zh: "票价的上涨", en: "the rise in fares" },
  ]),
  m("get quite used to", "在城市生活几年后，许多人会变得相当习惯拥挤的公共交通。", "After living in a city for several years, many people get quite used to crowded public transport.", "get quite used to", [
    { zh: "拥挤的公共交通", en: "crowded public transport" },
  ]),
  m("in response to", "为回应家长提出的担忧，几所学校修改了家庭作业政策。", "Several schools revised their homework policies in response to concerns raised by parents.", "in response to", [
    { zh: "家庭作业政策", en: "homework policies" },
    { zh: "家长提出的担忧", en: "concerns raised by parents" },
  ]),
  m("be lined up against", "救援物资在分发给洪灾受害者之前，被靠墙排成一列。", "Emergency supplies were lined up against the wall before being distributed to flood victims.", "lined up against", [
    { zh: "救援物资", en: "emergency supplies" },
    { zh: "洪灾受害者", en: "flood victims" },
  ]),
  m("live by doing something", "在一些旅游小镇，许多家庭靠向游客出售手工制品谋生。", "In some tourist towns, many families live by selling handmade products to visitors.", "live by selling", [
    { zh: "旅游小镇", en: "tourist towns" },
    { zh: "手工制品", en: "handmade products" },
  ]),
  m("in the light of", "根据最近的科学证据，政府应当重新考虑这项能源政策。", "In the light of recent scientific evidence, the government should reconsider this energy policy.", "in the light of", [
    { zh: "科学证据", en: "scientific evidence" },
    { zh: "重新考虑", en: "reconsider" },
  ]),
  m("measure the value of something in terms of something", "我们不应只用毕业生的起薪来衡量高等教育的价值。", "We should not measure the value of higher education solely in terms of graduates' starting salaries.", "measure the value of higher education solely in terms of", [
    { zh: "高等教育", en: "higher education" },
    { zh: "毕业生的起薪", en: "graduates' starting salaries" },
  ]),
  m("estimate the true value of", "仅从经济角度估计无偿照护工作的真正价值十分困难。", "It is difficult to estimate the true value of unpaid care work in purely financial terms.", "estimate the true value of", [
    { zh: "无偿照护工作", en: "unpaid care work" },
    { zh: "仅从经济角度", en: "in purely financial terms" },
  ]),
  m("grudge paying someone a high fee for something", "顾客可能不情愿为缓慢的配送服务向快递公司支付高额费用。", "Customers may grudge paying a delivery company a high fee for a slow service.", "grudge paying a delivery company a high fee for", [
    { zh: "快递公司", en: "a delivery company" },
    { zh: "缓慢的配送服务", en: "a slow service" },
  ]),
  m("the only exception to this general rule", "大多数当地设施都会收取入场费，公共图书馆是这一普遍规则的唯一例外。", "Most local facilities charge admission, and the public library is the only exception to this general rule.", "the only exception to this general rule", [
    { zh: "当地设施", en: "local facilities" },
    { zh: "收取入场费", en: "charge admission" },
  ]),
  m("arouse the pity of", "受伤动物的照片可能引起公众的怜悯，但情绪反应本身不能决定政策。", "Images of injured animals may arouse the pity of the public, but emotional reactions alone cannot determine policy.", "arouse the pity of", [
    { zh: "受伤动物", en: "injured animals" },
    { zh: "情绪反应", en: "emotional reactions" },
  ]),
  m("sacrifice human dignity", "社会福利制度不应要求人们为了获得基本帮助而牺牲人的尊严。", "A welfare system should not require people to sacrifice human dignity in order to receive basic support.", "sacrifice human dignity", [
    { zh: "社会福利制度", en: "a welfare system" },
    { zh: "基本帮助", en: "basic support" },
  ]),
  m("be fully aware of the consequences", "企业必须充分意识到未经同意收集个人数据的后果。", "Companies must be fully aware of the consequences of collecting personal data without consent.", "be fully aware of the consequences", [
    { zh: "个人数据", en: "personal data" },
    { zh: "未经同意", en: "without consent" },
  ]),
  m("be free from anxieties", "稳定的住房可以让家庭免受突然被赶走所带来的焦虑。", "Stable housing enables families to be free from anxieties about sudden eviction.", "be free from anxieties", [
    { zh: "稳定的住房", en: "stable housing" },
    { zh: "突然被赶走", en: "sudden eviction" },
  ]),
  m("move from place to place with ease", "价格可负担的铁路通票让年轻旅行者能够轻松辗转各地。", "Affordable rail passes allow young travellers to move from place to place with ease.", "move from place to place with ease", [
    { zh: "价格可负担的铁路通票", en: "affordable rail passes" },
    { zh: "年轻旅行者", en: "young travellers" },
  ]),
  m("sleep in the open", "如果没有紧急收容所，一些无家可归者在冬天会被迫露天睡觉。", "Without emergency shelters, some homeless people are forced to sleep in the open during winter.", "sleep in the open", [
    { zh: "紧急收容所", en: "emergency shelters" },
    { zh: "无家可归者", en: "homeless people" },
  ]),
  m("in times of real need", "健全的社会安全网应当在家庭真正需要帮助的时候保护他们。", "A strong social safety net should protect families in times of real need.", "in times of real need", [
    { zh: "社会安全网", en: "social safety net" },
  ]),
  m("speak of someone with contempt", "公职人员不应以轻蔑的口吻谈论失业者。", "Public officials should not speak of unemployed people with contempt.", "speak of unemployed people with contempt", [
    { zh: "公职人员", en: "public officials" },
    { zh: "失业者", en: "unemployed people" },
  ]),
  m("put someone in the same class as", "把偶尔使用网络的人与严重成瘾者归为一类会造成误导。", "It is misleading to put occasional internet users in the same class as people with a serious addiction.", "put occasional internet users in the same class as", [
    { zh: "偶尔使用网络的人", en: "occasional internet users" },
    { zh: "严重成瘾者", en: "people with a serious addiction" },
  ]),
  m("freedom from care", "简单的乡村生活常被浪漫化为能够带来无忧无虑的状态。", "A simple rural life is often romanticised as offering freedom from care.", "freedom from care", [
    { zh: "被浪漫化", en: "romanticised" },
    { zh: "简单的乡村生活", en: "a simple rural life" },
  ]),
];

const manualByCanonical = new Map(manualRows.map((row) => [row.canonical, row]));
if (manualByCanonical.size !== manualRows.length) throw new Error("Duplicate canonical text in manual Collocation Use rows");

const supplementalHints = new Map([
  ["a positive relationship between", [{ zh: "遵守环境法规", en: "compliance with environmental regulations" }]],
  ["a reliable alternative to", [{ zh: "远程医疗", en: "telemedicine" }, { zh: "面对面问诊", en: "face-to-face consultations" }]],
  ["a rich variety of", [{ zh: "多元文化城市", en: "multicultural cities" }]],
  ["a sedentary lifestyle", [{ zh: "远程办公", en: "remote work" }]],
  ["a sense of purpose in life", [{ zh: "志愿服务", en: "voluntary work" }]],
  ["a waste of resources", [{ zh: "没有明确需求", en: "with no clear demand" }]],
  ["academic qualifications", [{ zh: "实际经验", en: "practical experience" }]],
  ["alternative sources of financial support", [{ zh: "门票收入", en: "ticket sales" }]],
  ["be cleared for human use", [{ zh: "严格测试", en: "rigorously tested" }]],
  ["be highly addictive", [{ zh: "随机奖励", en: "random rewards" }]],
  ["be in conflict with", [{ zh: "无限制的数据收集", en: "unrestricted data collection" }]],
  ["career progression", [{ zh: "透明的晋升标准", en: "transparent promotion criteria" }]],
  ["create new possibilities for", [{ zh: "高速网络", en: "high-speed internet" }]],
  ["discourage real interaction", [{ zh: "过度依赖", en: "excessive reliance on" }]],
  ["ethical arguments against", [{ zh: "未经同意", en: "without consent" }]],
  ["exist side by side with", [{ zh: "电子商务平台", en: "e-commerce platforms" }]],
  ["go against the values of", [{ zh: "歧视性的招聘制度", en: "discriminatory recruitment systems" }]],
  ["limit emissions from", [{ zh: "燃煤电站", en: "coal-fired power stations" }]],
  ["maintain the natural balance", [{ zh: "捕食者", en: "predators" }]],
  ["take measures to tackle", [{ zh: "不断扩大的住房短缺", en: "the growing housing shortage" }]],
]);

const allCardSeeds = cards.flatMap((card) => [
  card.exercise_seed?.guided_application,
  ...(card.exercise_seed?.slot_replacement ?? []),
].filter(Boolean));

function reviewedReuse(collocation) {
  return allCardSeeds.find((seed) => seed.reference_answer
    ?.toLowerCase()
    .includes(collocation.canonical_text.toLowerCase()));
}

const generatedItems = collocations.map((collocation) => {
  const existing = existingById.get(collocation.id);
  if (existing) return withReviewHistory(existing);
  const row = manualByCanonical.get(collocation.canonical_text);
  if (row) {
    return {
      collocation_id: collocation.id,
      prompt_zh: row.prompt,
      hints: row.hints.length ? row.hints : supplementalHints.get(collocation.canonical_text) ?? [],
      target_surface: row.targetSurface,
      reference_answer: row.answer,
      transfer_type: collocation.pattern ? "slot_replacement" : "cross_topic",
      review_status: "candidate",
      review_history: [createdEvent],
    };
  }
  const reused = reviewedReuse(collocation);
  if (!reused) throw new Error(`Missing Collocation Use row for '${collocation.canonical_text}'`);
  return {
    collocation_id: collocation.id,
    prompt_zh: reused.prompt_zh,
    hints: [],
    target_surface: collocation.canonical_text,
    reference_answer: reused.reference_answer,
    transfer_type: "cross_topic",
    review_status: "candidate",
    review_history: [createdEvent],
  };
});

if (generatedItems.length !== collocations.length) throw new Error("Collocation Use candidate coverage is incomplete");
const output = {
  schema_version: "1.0.0",
  generated_at: "2026-08-18T17:15:00+08:00",
  items: generatedItems,
};
fs.writeFileSync(candidatePath, `${JSON.stringify(output, null, 2)}\n`);
process.stdout.write(`Generated ${generatedItems.length} Collocation Use prompt candidates (${generatedItems.filter((item) => item.review_status === "approved").length} approved, ${generatedItems.filter((item) => item.review_status === "candidate").length} pending).\n`);
